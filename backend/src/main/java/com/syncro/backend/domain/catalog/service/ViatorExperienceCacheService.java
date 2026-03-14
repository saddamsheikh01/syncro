package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.domain.catalog.entity.ViatorExperienceCache;
import com.syncro.backend.domain.catalog.entity.ViatorFetchJob;
import com.syncro.backend.domain.catalog.repository.ViatorExperienceCacheRepository;
import com.syncro.backend.domain.catalog.repository.ViatorFetchJobRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves locale, builds Viator cache keys, and find-or-create fetch jobs.
 * Used when source=VIATOR for nearby or search: cache hit → 200, cache miss → 202 + job.
 */
@Service
public class ViatorExperienceCacheService {

    private static final String DEFAULT_LOCALE = "en";
    /** Round coordinates to this many decimals for stable cache keys. */
    private static final int COORD_DECIMALS = 2;

    /** All locales we pre-fetch for nearby (match frontend language options). */
    public static final List<String> NEARBY_LOCALES = List.of("en", "it", "es", "fr", "sq", "pt");

    private final ViatorExperienceCacheRepository cacheRepository;
    private final ViatorFetchJobRepository jobRepository;

    public ViatorExperienceCacheService(
        ViatorExperienceCacheRepository cacheRepository,
        ViatorFetchJobRepository jobRepository
    ) {
        this.cacheRepository = cacheRepository;
        this.jobRepository = jobRepository;
    }

    /** Resolve locale: request param overrides Accept-Language so the API can check locale instantly. */
    public String resolveLocale(String requestLocale) {
        if (requestLocale != null && !requestLocale.isBlank()) {
            String normalized = requestLocale.trim().toLowerCase(Locale.ROOT);
            int dash = normalized.indexOf('-');
            if (dash > 0) {
                normalized = normalized.substring(0, dash);
            }
            if (!normalized.isEmpty()) {
                return normalized;
            }
        }
        String tag = LocaleContextHolder.getLocale().toLanguageTag();
        if (tag == null || tag.isBlank()) {
            return DEFAULT_LOCALE;
        }
        String fromHeader = tag.trim().toLowerCase(Locale.ROOT);
        int dash = fromHeader.indexOf('-');
        return dash > 0 ? fromHeader.substring(0, dash) : fromHeader;
    }

    /** @deprecated Use {@link #resolveLocale(String)} with request param when available. */
    public String resolveLocale() {
        return resolveLocale(null);
    }

    public String buildCacheKeyNearby(double lat, double lng, String locale) {
        double roundedLat = roundCoord(lat, COORD_DECIMALS);
        double roundedLng = roundCoord(lng, COORD_DECIMALS);
        return "nearby:" + roundedLat + ":" + roundedLng + ":" + (locale != null ? locale : DEFAULT_LOCALE);
    }

    public String buildCacheKeySearch(String normalizedQuery, String locale) {
        String q = normalizedQuery != null ? normalizedQuery.trim().toLowerCase(Locale.ROOT) : "";
        return "search:" + q + ":" + (locale != null ? locale : DEFAULT_LOCALE);
    }

    private static double roundCoord(double value, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    @Transactional(readOnly = true)
    public Optional<ViatorExperienceCache> findValidCache(String cacheKey) {
        return cacheRepository.findByCacheKey(cacheKey)
            .filter(c -> c.getExpiresAt().isAfter(Instant.now()));
    }

    @Transactional(readOnly = true)
    public Optional<ViatorFetchJob> findExistingJob(String cacheKey) {
        List<ViatorFetchJob> list = jobRepository.findPendingOrRunningByCacheKey(cacheKey);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.getFirst());
    }

    /** Commits in its own transaction so the job is visible when called from read-only getExperiences(). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ViatorFetchJob createJob(String cacheKey, String jobType, String locale, Map<String, Object> params) {
        ViatorFetchJob job = new ViatorFetchJob();
        job.setCacheKey(cacheKey);
        job.setJobType(jobType);
        job.setLocale(locale != null ? locale : DEFAULT_LOCALE);
        job.setParams(params != null ? params : Map.of());
        job.setStatus(ViatorFetchJob.STATUS_PENDING);
        job.setRetryCount(0);
        job.setMaxRetries(3);
        Instant now = Instant.now();
        job.setCreatedAt(now);
        job.setUpdatedAt(now);
        return jobRepository.save(job);
    }
}
