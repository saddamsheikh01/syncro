package com.syncro.backend.domain.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.entity.ViatorExperienceCache;
import com.syncro.backend.domain.catalog.entity.ViatorFetchJob;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.catalog.repository.ViatorExperienceCacheRepository;
import com.syncro.backend.domain.catalog.repository.ViatorFetchJobRepository;
import com.syncro.backend.domain.external.viator.ViatorClient;
import com.syncro.backend.domain.external.viator.ViatorNearbyDestinationResolver;
import com.syncro.backend.domain.external.viator.ViatorProductMapper;
import com.syncro.backend.domain.external.viator.dto.ViatorProductSearchByTermResult;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Background worker: processes Viator fetch jobs (NEARBY / SEARCH), writes experiences and cache, then marks job completed/failed.
 */
@Service
public class ViatorFetchWorkerService {

    private static final Logger log = LoggerFactory.getLogger(ViatorFetchWorkerService.class);
    private static final String PROVIDER = "VIATOR";
    /** Cache TTL after a successful fetch. */
    private static final long CACHE_TTL_SECONDS = 24 * 60 * 60;
    private static final int FETCH_PAGE_SIZE = 50;

    private final ViatorFetchJobRepository jobRepository;
    private final ViatorExperienceCacheRepository cacheRepository;
    private final ExperienceRepository experienceRepository;
    private final ViatorClient viatorClient;
    private final ViatorNearbyDestinationResolver nearbyResolver;
    private final ViatorProductMapper viatorProductMapper;
    private final Executor viatorFetchWorkerExecutor;
    private final int concurrency;
    /** Self-reference for transactional proxy (claim runs in short transaction without holding across join). */
    private final ViatorFetchWorkerService self;
    private final ConfigurableApplicationContext applicationContext;

    public ViatorFetchWorkerService(
        ViatorFetchJobRepository jobRepository,
        ViatorExperienceCacheRepository cacheRepository,
        ExperienceRepository experienceRepository,
        ViatorClient viatorClient,
        ViatorNearbyDestinationResolver nearbyResolver,
        ViatorProductMapper viatorProductMapper,
        @Qualifier("viatorFetchWorkerExecutor") Executor viatorFetchWorkerExecutor,
        @Value("${app.viator-fetch-worker.concurrency:6}") int concurrency,
        @Lazy ViatorFetchWorkerService self,
        ConfigurableApplicationContext applicationContext
    ) {
        this.jobRepository = jobRepository;
        this.cacheRepository = cacheRepository;
        this.experienceRepository = experienceRepository;
        this.viatorClient = viatorClient;
        this.nearbyResolver = nearbyResolver;
        this.viatorProductMapper = viatorProductMapper;
        this.viatorFetchWorkerExecutor = viatorFetchWorkerExecutor;
        this.concurrency = Math.max(1, concurrency);
        this.self = self;
        this.applicationContext = applicationContext;
    }

    @Scheduled(fixedDelayString = "${app.viator-fetch-worker.fixed-delay-ms:120000}")
    public void processNextJob() {
        if (!applicationContext.isActive()) {
            return;
        }
        List<UUID> claimedIds = self.claimNextJobs(concurrency);
        if (claimedIds.isEmpty()) {
            self.logJobCountsWhenEmpty();
            return;
        }
        log.info("[ViatorFetchWorker] Claimed {} jobs, processing in parallel", claimedIds.size());
        List<CompletableFuture<Void>> futures = claimedIds.stream()
            .map(id -> CompletableFuture.runAsync(() -> processOneJob(id), viatorFetchWorkerExecutor))
            .toList();
        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
    }

    /** Logs job counts (runs in read-only transaction so scheduler path has no long-held write tx). */
    @Transactional(readOnly = true)
    public void logJobCountsWhenEmpty() {
        long total = jobRepository.count();
        long p = jobRepository.countByStatus(ViatorFetchJob.STATUS_PENDING);
        long r = jobRepository.countByStatus(ViatorFetchJob.STATUS_RUNNING);
        long c = jobRepository.countByStatus(ViatorFetchJob.STATUS_COMPLETED);
        long f = jobRepository.countByStatus(ViatorFetchJob.STATUS_FAILED);
        log.info("[ViatorFetchWorker] No eligible pending jobs (total={} PENDING={} RUNNING={} COMPLETED={} FAILED={}); next run in 2 min",
            total, p, r, c, f);
    }

    /** Claims up to maxJobs pending jobs (locks and sets RUNNING) in one transaction. */
    @Transactional
    public List<UUID> claimNextJobs(int maxJobs) {
        List<ViatorFetchJob> pending = jobRepository.findNextPending(PageRequest.of(0, maxJobs));
        if (pending.isEmpty()) {
            return List.of();
        }
        Instant now = Instant.now();
        for (ViatorFetchJob job : pending) {
            job.setStatus(ViatorFetchJob.STATUS_RUNNING);
            job.setUpdatedAt(now);
        }
        jobRepository.saveAll(pending);
        return pending.stream().map(ViatorFetchJob::getId).toList();
    }

    /** Processes a single job in its own transaction (called in parallel by the executor). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOneJob(UUID jobId) {
        Optional<ViatorFetchJob> opt = jobRepository.findById(jobId);
        if (opt.isEmpty()) {
            return;
        }
        ViatorFetchJob job = opt.get();
        if (!ViatorFetchJob.STATUS_RUNNING.equals(job.getStatus())) {
            return;
        }
        log.info("[ViatorFetchWorker] Picked job jobId={} type={} cacheKey={} locale={}",
            job.getId(), job.getJobType(), job.getCacheKey(), job.getLocale());

        try {
            List<JsonNode> products = runFetch(job);
            log.info("[ViatorFetchWorker] API fetch completed jobId={} products={}",
                job.getId(), products != null ? products.size() : 0);

            List<UUID> experienceIds = upsertExperiences(job.getLocale(), products);
            log.info("[ViatorFetchWorker] Upserted experiences jobId={} count={}", job.getId(), experienceIds.size());

            saveCache(job.getCacheKey(), job.getJobType(), job.getLocale(), experienceIds);
            log.info("[ViatorFetchWorker] Cache saved jobId={} cacheKey={}", job.getId(), job.getCacheKey());

            job.setStatus(ViatorFetchJob.STATUS_COMPLETED);
            job.setCompletedAt(Instant.now());
            job.setLastError(null);
            log.info("[ViatorFetchWorker] Job completed jobId={}", job.getId());
        } catch (Exception e) {
            log.warn("[ViatorFetchWorker] Job failed jobId={} retry={}/{} error={}",
                job.getId(), job.getRetryCount() + 1, job.getMaxRetries(), e.getMessage());
            job.setRetryCount(job.getRetryCount() + 1);
            job.setLastError(e.getMessage());
            job.setStatus(job.getRetryCount() >= job.getMaxRetries()
                ? ViatorFetchJob.STATUS_FAILED
                : ViatorFetchJob.STATUS_PENDING);
        }
        job.setUpdatedAt(Instant.now());
        jobRepository.save(job);
    }

    private List<JsonNode> runFetch(ViatorFetchJob job) {
        String locale = job.getLocale() != null ? job.getLocale() : "en";
        Map<String, Object> params = job.getParams() != null ? job.getParams() : Map.of();

        if (ViatorFetchJob.JOB_TYPE_SEARCH.equals(job.getJobType())) {
            String q = (String) params.get("q");
            if (q == null || q.isBlank()) {
                log.info("[ViatorFetchWorker] SEARCH jobId={} skipped: empty q", job.getId());
                return List.of();
            }
            log.info("[ViatorFetchWorker] SEARCH jobId={} calling Viator searchProductsBySearchTerm q={} locale={}",
                job.getId(), q, locale);
            ViatorProductSearchByTermResult result = viatorClient.searchProductsBySearchTerm(
                q, 0, FETCH_PAGE_SIZE, "EUR", locale
            );
            List<JsonNode> products = result.products() != null ? result.products() : List.of();
            log.info("[ViatorFetchWorker] SEARCH jobId={} Viator returned products={}", job.getId(), products.size());
            return products;
        }

        if (ViatorFetchJob.JOB_TYPE_NEARBY.equals(job.getJobType())) {
            Double lat = number(params.get("lat"));
            Double lng = number(params.get("lng"));
            if (lat == null || lng == null) {
                log.info("[ViatorFetchWorker] NEARBY jobId={} skipped: missing lat/lng", job.getId());
                return List.of();
            }
            log.info("[ViatorFetchWorker] NEARBY jobId={} calling Google reverse geocode + Viator resolveDestinationRefs lat={} lng={} locale={}",
                job.getId(), lat, lng, locale);
            List<String> destinationRefs = nearbyResolver.resolveDestinationRefs(
                lat, lng, locale, 6
            );
            log.info("[ViatorFetchWorker] NEARBY jobId={} got destinationRefs={} refs={}",
                job.getId(), destinationRefs.size(), destinationRefs);
            if (destinationRefs.isEmpty()) {
                return List.of();
            }
            log.info("[ViatorFetchWorker] NEARBY jobId={} calling Viator searchProductsByCoordinates refs={}",
                job.getId(), destinationRefs.size());
            ViatorProductSearchByTermResult result = viatorClient.searchProductsByCoordinates(
                destinationRefs, 0, FETCH_PAGE_SIZE, "EUR", locale
            );
            List<JsonNode> products = result.products() != null ? result.products() : List.of();
            log.info("[ViatorFetchWorker] NEARBY jobId={} Viator returned products={}", job.getId(), products.size());
            return products;
        }

        return List.of();
    }

    private static Double number(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<UUID> upsertExperiences(String locale, List<JsonNode> products) {
        Instant now = Instant.now();
        List<UUID> ids = new ArrayList<>();
        for (JsonNode product : products) {
            String productCode = product.path("productCode").asText("");
            if (productCode.isBlank()) continue;

            Optional<Experience> existingOpt = experienceRepository.findByProviderAndExternalIdAndLocale(
                PROVIDER, productCode, locale
            );
            Experience experience = existingOpt.orElseGet(Experience::new);
            viatorProductMapper.updateExperience(experience, product, now);
            experience.setLocale(locale);
            Experience saved = experienceRepository.save(experience);
            ids.add(saved.getId());
        }
        return ids;
    }

    private void saveCache(String cacheKey, String cacheType, String locale, List<UUID> experienceIds) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(CACHE_TTL_SECONDS);

        Optional<ViatorExperienceCache> existing = cacheRepository.findByCacheKey(cacheKey);
        ViatorExperienceCache cache;
        if (existing.isPresent()) {
            cache = existing.get();
            cache.setExperienceIds(experienceIds);
            cache.setExpiresAt(expiresAt);
        } else {
            cache = new ViatorExperienceCache();
            cache.setCacheKey(cacheKey);
            cache.setCacheType(cacheType);
            cache.setLocale(locale);
            cache.setExperienceIds(experienceIds);
            cache.setCreatedAt(now);
            cache.setExpiresAt(expiresAt);
        }
        cacheRepository.save(cache);
    }
}
