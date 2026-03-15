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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;
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
    private static final long CACHE_TTL_SECONDS = 24 * 60 * 60;
    private static final int FETCH_PAGE_SIZE = 50;

    private final ViatorFetchJobRepository jobRepository;
    private final ViatorExperienceCacheRepository cacheRepository;
    private final ExperienceRepository experienceRepository;
    private final ViatorClient viatorClient;
    private final ViatorNearbyDestinationResolver nearbyResolver;
    private final ViatorProductMapper viatorProductMapper;
    private final ViatorExperienceCacheService viatorExperienceCacheService;
    private final Executor viatorFetchWorkerExecutor;
    private final int concurrency;
    private final ViatorFetchWorkerService self;
    private final ConfigurableApplicationContext applicationContext;

    public ViatorFetchWorkerService(
        ViatorFetchJobRepository jobRepository,
        ViatorExperienceCacheRepository cacheRepository,
        ExperienceRepository experienceRepository,
        ViatorClient viatorClient,
        ViatorNearbyDestinationResolver nearbyResolver,
        ViatorProductMapper viatorProductMapper,
        ViatorExperienceCacheService viatorExperienceCacheService,
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
        this.viatorExperienceCacheService = viatorExperienceCacheService;
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

    @Transactional(readOnly = true)
    public void logJobCountsWhenEmpty() {
        long total = jobRepository.count();
        long p = jobRepository.countByStatus(ViatorFetchJob.STATUS_PENDING);
        long r = jobRepository.countByStatus(ViatorFetchJob.STATUS_RUNNING);
        long c = jobRepository.countByStatus(ViatorFetchJob.STATUS_COMPLETED);
        long f = jobRepository.countByStatus(ViatorFetchJob.STATUS_FAILED);
        log.info("[ViatorFetchWorker] No eligible pending jobs (total={} PENDING={} RUNNING={} COMPLETED={} FAILED={}); next run in ~5 s",
            total, p, r, c, f);
    }

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

    /**
     * Orchestrates one job: loads it (short tx), calls external APIs (no tx, no held connection),
     * then saves results (short tx). Enqueues background locale jobs after commit.
     */
    public void processOneJob(UUID jobId) {
        ViatorFetchJob job = self.loadJobIfRunning(jobId);
        if (job == null) {
            return;
        }
        log.info("[ViatorFetchWorker] Processing jobId={} type={} cacheKey={} locale={}",
            job.getId(), job.getJobType(), job.getCacheKey(), job.getLocale());

        // resolvedParams carries data between fetch and persist (e.g. destinationRefs resolved during NEARBY fetch)
        Map<String, Object> resolvedParams = new LinkedHashMap<>(job.getParams() != null ? job.getParams() : Map.of());

        try {
            List<JsonNode> products = runFetch(job, resolvedParams);
            log.info("[ViatorFetchWorker] Fetched jobId={} products={}", jobId, products.size());

            self.persistResults(jobId, job.getLocale(), job.getCacheKey(), job.getJobType(), products, resolvedParams);
            log.info("[ViatorFetchWorker] Job completed jobId={}", jobId);
        } catch (Exception e) {
            log.warn("[ViatorFetchWorker] Job failed jobId={} retry={}/{} error={}",
                jobId, job.getRetryCount() + 1, job.getMaxRetries(), e.getMessage());
            self.markFailed(jobId, job.getRetryCount(), job.getMaxRetries(), e.getMessage());
            return;
        }

        enqueueOtherLocaleJobs(job.getJobType(), job.getLocale(), resolvedParams);
    }

    /** Short read-only transaction to load the job. Returns null if not found or not in RUNNING state. */
    @Transactional(readOnly = true)
    public ViatorFetchJob loadJobIfRunning(UUID jobId) {
        return jobRepository.findById(jobId)
            .filter(j -> ViatorFetchJob.STATUS_RUNNING.equals(j.getStatus()))
            .orElse(null);
    }

    /** Short write transaction: batch-upsert experiences, save cache, mark job COMPLETED. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistResults(
        UUID jobId,
        String locale,
        String cacheKey,
        String jobType,
        List<JsonNode> products,
        Map<String, Object> resolvedParams
    ) {
        List<UUID> experienceIds = upsertExperiences(locale, products);
        log.info("[ViatorFetchWorker] Upserted experiences jobId={} count={}", jobId, experienceIds.size());

        saveCache(cacheKey, jobType, locale, experienceIds);

        ViatorFetchJob job = jobRepository.findById(jobId)
            .orElseThrow(() -> new IllegalStateException("Job not found: " + jobId));
        job.setStatus(ViatorFetchJob.STATUS_COMPLETED);
        job.setCompletedAt(Instant.now());
        job.setLastError(null);
        job.setParams(resolvedParams);
        job.setUpdatedAt(Instant.now());
        jobRepository.save(job);
    }

    /** Short write transaction: increment retry count and update job status to FAILED or PENDING. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(UUID jobId, int currentRetry, int maxRetries, String error) {
        jobRepository.findById(jobId).ifPresent(job -> {
            int newRetry = currentRetry + 1;
            job.setRetryCount(newRetry);
            job.setLastError(error);
            job.setStatus(newRetry >= maxRetries
                ? ViatorFetchJob.STATUS_FAILED
                : ViatorFetchJob.STATUS_PENDING);
            job.setUpdatedAt(Instant.now());
            jobRepository.save(job);
        });
    }

    private List<JsonNode> runFetch(ViatorFetchJob job, Map<String, Object> resolvedParams) {
        String locale = job.getLocale() != null ? job.getLocale() : "en";

        if (ViatorFetchJob.JOB_TYPE_SEARCH.equals(job.getJobType())) {
            String q = (String) resolvedParams.get("q");
            if (q == null || q.isBlank()) {
                log.info("[ViatorFetchWorker] SEARCH jobId={} skipped: empty q", job.getId());
                return List.of();
            }
            log.info("[ViatorFetchWorker] SEARCH jobId={} q={} locale={}", job.getId(), q, locale);
            ViatorProductSearchByTermResult result = viatorClient.searchProductsBySearchTerm(
                q, 0, FETCH_PAGE_SIZE, "EUR", locale);
            List<JsonNode> products = result.products() != null ? result.products() : List.of();
            log.info("[ViatorFetchWorker] SEARCH jobId={} products={}", job.getId(), products.size());
            return products;
        }

        if (ViatorFetchJob.JOB_TYPE_NEARBY.equals(job.getJobType())) {
            Double lat = number(resolvedParams.get("lat"));
            Double lng = number(resolvedParams.get("lng"));
            if (lat == null || lng == null) {
                log.info("[ViatorFetchWorker] NEARBY jobId={} skipped: missing lat/lng", job.getId());
                return List.of();
            }

            // Reuse destination refs if already resolved by a parent job (avoids re-geocoding for background locale jobs)
            List<String> destinationRefs = preResolvedDestinationRefs(resolvedParams);
            if (destinationRefs != null) {
                log.info("[ViatorFetchWorker] NEARBY jobId={} reusing pre-resolved refs={}", job.getId(), destinationRefs.size());
            } else {
                log.info("[ViatorFetchWorker] NEARBY jobId={} resolving via geocode lat={} lng={} locale={}", job.getId(), lat, lng, locale);
                destinationRefs = nearbyResolver.resolveDestinationRefs(lat, lng, locale, 6);
                log.info("[ViatorFetchWorker] NEARBY jobId={} resolved refs={} {}", job.getId(), destinationRefs.size(), destinationRefs);
                // Persist in resolvedParams so background locale jobs (created after this tx commits) can reuse
                resolvedParams.put("destinationRefs", destinationRefs);
            }

            if (destinationRefs.isEmpty()) {
                return List.of();
            }
            log.info("[ViatorFetchWorker] NEARBY jobId={} calling Viator searchProductsByCoordinates refs={}", job.getId(), destinationRefs.size());
            ViatorProductSearchByTermResult result = viatorClient.searchProductsByCoordinates(
                destinationRefs, 0, FETCH_PAGE_SIZE, "EUR", locale);
            List<JsonNode> products = result.products() != null ? result.products() : List.of();
            log.info("[ViatorFetchWorker] NEARBY jobId={} products={}", job.getId(), products.size());
            return products;
        }

        return List.of();
    }

    /**
     * Batch-upserts experiences: one SELECT for all product codes, one saveAll instead of N individual queries.
     * N+1 → 2 queries for a batch of 50 products.
     */
    private List<UUID> upsertExperiences(String locale, List<JsonNode> products) {
        if (products.isEmpty()) {
            return List.of();
        }
        Instant now = Instant.now();

        List<String> productCodes = products.stream()
            .map(p -> p.path("productCode").asText(""))
            .filter(code -> !code.isBlank())
            .distinct()
            .toList();

        Map<String, Experience> existingByCode = experienceRepository
            .findByProviderAndLocaleAndExternalIdIn(PROVIDER, locale, productCodes)
            .stream()
            .collect(Collectors.toMap(Experience::getExternalId, e -> e));

        List<Experience> toSave = new ArrayList<>();
        for (JsonNode product : products) {
            String productCode = product.path("productCode").asText("");
            if (productCode.isBlank()) continue;
            Experience experience = existingByCode.getOrDefault(productCode, new Experience());
            viatorProductMapper.updateExperience(experience, product, now);
            experience.setLocale(locale);
            toSave.add(experience);
        }

        return experienceRepository.saveAll(toSave).stream()
            .map(Experience::getId)
            .toList();
    }

    /**
     * Enqueues pending jobs for all other supported locales after the requested locale completes.
     * NEARBY jobs pass the pre-resolved destinationRefs so background jobs skip geocoding.
     * Called after persistResults tx has committed — no DB reload of the completed job needed.
     */
    private void enqueueOtherLocaleJobs(String jobType, String completedLocale, Map<String, Object> params) {
        for (String locale : ViatorExperienceCacheService.NEARBY_LOCALES) {
            if (locale.equals(completedLocale)) continue;
            try {
                if (ViatorFetchJob.JOB_TYPE_NEARBY.equals(jobType)) {
                    Double lat = number(params.get("lat"));
                    Double lng = number(params.get("lng"));
                    if (lat == null || lng == null) continue;
                    String cacheKey = viatorExperienceCacheService.buildCacheKeyNearby(lat, lng, locale);
                    if (viatorExperienceCacheService.findValidCache(cacheKey).isPresent()) continue;
                    if (viatorExperienceCacheService.findExistingJob(cacheKey).isPresent()) continue;
                    Map<String, Object> newParams = new LinkedHashMap<>(params);
                    newParams.put("locale", locale);
                    ViatorFetchJob created = viatorExperienceCacheService.createJob(
                        cacheKey, ViatorFetchJob.JOB_TYPE_NEARBY, locale, newParams);
                    log.info("[ViatorFetchWorker] Enqueued background NEARBY job locale={} jobId={}", locale, created.getId());

                } else if (ViatorFetchJob.JOB_TYPE_SEARCH.equals(jobType)) {
                    String q = (String) params.get("q");
                    if (q == null || q.isBlank()) continue;
                    String cacheKey = viatorExperienceCacheService.buildCacheKeySearch(q, locale);
                    if (viatorExperienceCacheService.findValidCache(cacheKey).isPresent()) continue;
                    if (viatorExperienceCacheService.findExistingJob(cacheKey).isPresent()) continue;
                    Map<String, Object> newParams = new LinkedHashMap<>();
                    newParams.put("q", q);
                    newParams.put("locale", locale);
                    ViatorFetchJob created = viatorExperienceCacheService.createJob(
                        cacheKey, ViatorFetchJob.JOB_TYPE_SEARCH, locale, newParams);
                    log.info("[ViatorFetchWorker] Enqueued background SEARCH job locale={} jobId={}", locale, created.getId());
                }
            } catch (Exception e) {
                log.warn("[ViatorFetchWorker] Failed to enqueue background job locale={}: {}", locale, e.getMessage());
            }
        }
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

    private static Double number(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private static List<String> preResolvedDestinationRefs(Map<String, Object> params) {
        Object refs = params.get("destinationRefs");
        if (refs instanceof List<?> list && !list.isEmpty()) {
            return (List<String>) list;
        }
        return null;
    }
}
