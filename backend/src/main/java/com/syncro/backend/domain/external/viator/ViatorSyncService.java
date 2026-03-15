package com.syncro.backend.domain.external.viator;

import com.fasterxml.jackson.databind.JsonNode;
import com.syncro.backend.domain.catalog.entity.AffiliationLink;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.repository.AffiliationLinkRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.external.viator.dto.ViatorFetchResult;
import com.syncro.backend.domain.external.viator.dto.ViatorProductSearchPage;
import com.syncro.backend.domain.external.viator.dto.ViatorProductsPage;
import com.syncro.backend.domain.external.viator.dto.ViatorSyncResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ViatorSyncService {

    private static final Logger log = LoggerFactory.getLogger(ViatorSyncService.class);
    private static final String PROVIDER = "VIATOR";
    private static final String SCOPE = "products";
    /** Locales to sync (must match ViatorExperienceCacheService.NEARBY_LOCALES; sq removed — not supported by Viator API). */
    private static final List<String> SYNC_LOCALES = List.of("en", "it", "es", "fr", "pt");
    private static final int BULK_SIZE = 50;
    private static final int MAX_ERROR_MESSAGES = 50;
    private static final String LOCATION_KEY_SEPARATOR = ":";

    private final ViatorClient viatorClient;
    private final ViatorConfig viatorConfig;
    private final ViatorNearbyDestinationResolver nearbyDestinationResolver;
    private final ViatorDestinationRefService viatorDestinationRefService;
    private final ViatorProductMapper productMapper;
    private final ExperienceRepository experienceRepository;
    private final AffiliationLinkRepository affiliationLinkRepository;
    private final ExternalSyncStateRepository syncStateRepository;
    private final ViatorSyncService self;
    private final Map<String, Instant> nearbyDestinationLastSync = new ConcurrentHashMap<>();
    private final Map<String, NearbyDestinationCacheEntry> nearbyDestinationCache = new ConcurrentHashMap<>();

    public ViatorSyncService(
        ViatorClient viatorClient,
        ViatorConfig viatorConfig,
        ViatorNearbyDestinationResolver nearbyDestinationResolver,
        ViatorDestinationRefService viatorDestinationRefService,
        ViatorProductMapper productMapper,
        ExperienceRepository experienceRepository,
        AffiliationLinkRepository affiliationLinkRepository,
        ExternalSyncStateRepository syncStateRepository,
        @Lazy ViatorSyncService self
    ) {
        this.viatorClient = viatorClient;
        this.viatorConfig = viatorConfig;
        this.nearbyDestinationResolver = nearbyDestinationResolver;
        this.viatorDestinationRefService = viatorDestinationRefService;
        this.productMapper = productMapper;
        this.experienceRepository = experienceRepository;
        this.affiliationLinkRepository = affiliationLinkRepository;
        this.syncStateRepository = syncStateRepository;
        this.self = self;
    }

    public record SyncCommand(
        int count,
        int maxPages,
        Instant modifiedSince,
        boolean resetCursor,
        String language
    ) {}

    public record NearbySyncResult(
        List<String> destinationRefs,
        int pagesProcessed,
        int productsSeen,
        int created,
        int updated,
        int deactivated,
        int errors,
        List<String> errorMessages
    ) {
        public static NearbySyncResult empty() {
            return new NearbySyncResult(List.of(), 0, 0, 0, 0, 0, 0, List.of());
        }
    }

    public NearbySyncResult syncNearbyForCoordinates(
        double latitude,
        double longitude,
        String language
    ) {
        if (!viatorConfig.isConfigured() || !viatorConfig.getSync().isNearbyEnabled()) {
            return NearbySyncResult.empty();
        }

        String effectiveLanguage = isNotBlank(language) ? language : viatorConfig.getDefaultLanguage();
        List<String> destinationRefs = resolveNearbyDestinationRefs(latitude, longitude, effectiveLanguage);
        if (destinationRefs.isEmpty()) {
            log.info("Viator nearby sync: no destinations resolved for lat={}, lng={}", latitude, longitude);
            return NearbySyncResult.empty();
        }
        log.info("Sync Viator nearby: lat={}, lng={}, destinationRefs={}", latitude, longitude, destinationRefs);

        Instant now = Instant.now();
        List<String> destinationsToSync = destinationRefs.stream()
            .filter(ref -> shouldSyncNearbyDestination(ref, now))
            .toList();

        if (destinationsToSync.isEmpty()) {
            log.info("Viator nearby sync: destinations were updated recently, skipping sync");
            return new NearbySyncResult(destinationRefs, 0, 0, 0, 0, 0, 0, List.of());
        }

        int maxPages = Math.max(viatorConfig.getSync().getNearbyMaxPages(), destinationsToSync.size());
        int countPerDestination = Math.max(viatorConfig.getSync().getNearbyCountPerDestination(), 1);
        FallbackSyncResult syncResult = syncUsingSearchFallback(
            maxPages,
            countPerDestination,
            effectiveLanguage,
            destinationsToSync
        );
        markNearbyDestinationsSynced(destinationsToSync, now);

        return new NearbySyncResult(
            destinationRefs,
            syncResult.pagesProcessed(),
            syncResult.productsSeen(),
            syncResult.created(),
            syncResult.updated(),
            syncResult.deactivated(),
            syncResult.errors(),
            syncResult.errorMessages()
        );
    }

    public ViatorSyncResponse syncProducts(SyncCommand command) {
        try {
            return doSyncProducts(command);
        } catch (RuntimeException ex) {
            log.error("Unexpected error during Viator sync", ex);
            String detail = normalize(ex.getMessage());
            String message = "Unexpected Viator sync error";
            if (detail != null) {
                message = message + ": " + detail;
            }
            return buildResponse(
                0, 0, 0, 0, 0, 1, null, command.modifiedSince(),
                List.of(message)
            );
        }
    }

    private ViatorSyncResponse doSyncProducts(SyncCommand command) {
        if (!viatorConfig.isConfigured()) {
            return buildResponse(
                0, 0, 0, 0, 0, 1, null, null,
                List.of("Viator API key is not configured")
            );
        }

        int count = command.count() > 0 ? command.count() : viatorConfig.getSync().getDefaultCount();
        int maxPages = command.maxPages() > 0 ? command.maxPages() : viatorConfig.getSync().getDefaultMaxPages();
        List<String> languagesToSync = isNotBlank(command.language())
            ? List.of(command.language())
            : SYNC_LOCALES;

        int totalPagesProcessed = 0;
        int totalProductsSeen = 0;
        int totalCreated = 0;
        int totalUpdated = 0;
        int totalDeactivated = 0;
        int totalErrors = 0;
        List<String> allErrorMessages = new ArrayList<>();

        for (String language : languagesToSync) {
            ExternalSyncState state = loadOrCreateState(language);
            if (command.resetCursor()) {
                state.setCursorValue(null);
                state.setCursorTs(null);
                state.setLastError(null);
                syncStateRepository.save(state);
            }

            String cursor = normalize(state.getCursorValue());
            Instant effectiveModifiedSince = resolveModifiedSince(command.modifiedSince(), cursor, state.getCursorTs());

            int pagesProcessed = 0;
            int productsSeen = 0;
            int created = 0;
            int updated = 0;
            int deactivated = 0;
            int errors = 0;
            List<String> errorMessages = new ArrayList<>();

            log.info("Starting Viator sync locale={}: count={}, maxPages={}, cursor={}", language, count, maxPages, cursor);

            if (viatorConfig.getSync().isUseSearchOnly()) {
                FallbackSyncResult fallback = syncUsingSearchFallback(maxPages, count, language);
                pagesProcessed = fallback.pagesProcessed();
                productsSeen = fallback.productsSeen();
                created = fallback.created();
                updated = fallback.updated();
                deactivated = fallback.deactivated();
                errors = fallback.errors();
                fallback.errorMessages().forEach(msg -> addError(errorMessages, msg));
                state.setCursorValue(null);
                state.setCursorTs(Instant.now());
                state.setLastSuccessAt(Instant.now());
                state.setLastError(errors == 0 ? null : firstError(errorMessages));
                syncStateRepository.save(state);
            } else {
                while (pagesProcessed < maxPages) {
                    ViatorFetchResult fetchResult = viatorClient.getModifiedProducts(
                        cursor, effectiveModifiedSince, count, language);

                    if (fetchResult.endpointAccessDenied()) {
                        addError(errorMessages,
                            "Endpoint /products/modified-since is not enabled for this key; falling back to /products/search");
                        FallbackSyncResult fallback = syncUsingSearchFallback(
                            Math.max(maxPages - pagesProcessed, 1), count, language);
                        pagesProcessed += fallback.pagesProcessed();
                        productsSeen += fallback.productsSeen();
                        created += fallback.created();
                        updated += fallback.updated();
                        deactivated += fallback.deactivated();
                        errors += fallback.errors();
                        fallback.errorMessages().forEach(msg -> addError(errorMessages, msg));
                        state.setCursorValue(null);
                        state.setCursorTs(Instant.now());
                        state.setLastSuccessAt(Instant.now());
                        state.setLastError(errors == 0 ? null : firstError(errorMessages));
                        syncStateRepository.save(state);
                        break;
                    }

                    if (!fetchResult.isSuccess()) {
                        errors++;
                        addError(errorMessages, "Error fetching products/modified-since page"
                            + (fetchResult.errorMessage() != null ? ": " + fetchResult.errorMessage() : ""));
                        state.setLastError(firstError(errorMessages));
                        syncStateRepository.save(state);
                        break;
                    }

                    ViatorProductsPage page = fetchResult.page();
                    pagesProcessed++;
                    List<JsonNode> products = page.products() != null ? page.products() : List.of();
                    productsSeen += products.size();

                    PageSyncResult pageResult = processPageProducts(products, language, true);
                    created += pageResult.created();
                    updated += pageResult.updated();
                    deactivated += pageResult.deactivated();
                    errors += pageResult.errors();
                    pageResult.errorMessages().forEach(msg -> addError(errorMessages, msg));

                    cursor = normalize(page.nextCursor());
                    state.setCursorValue(cursor);
                    state.setLastSuccessAt(Instant.now());
                    state.setLastError(errors == 0 ? null : firstError(errorMessages));
                    if (cursor == null) {
                        state.setCursorTs(Instant.now());
                    }
                    syncStateRepository.save(state);

                    if (cursor == null) {
                        break;
                    }
                    effectiveModifiedSince = null;
                }
            }

            totalPagesProcessed += pagesProcessed;
            totalProductsSeen += productsSeen;
            totalCreated += created;
            totalUpdated += updated;
            totalDeactivated += deactivated;
            totalErrors += errors;
            errorMessages.forEach(msg -> addError(allErrorMessages, "[" + language + "] " + msg));
        }

        return buildResponse(
            totalPagesProcessed,
            totalProductsSeen,
            totalCreated,
            totalUpdated,
            totalDeactivated,
            totalErrors,
            null,
            null,
            allErrorMessages
        );
    }

    private PageSyncResult processPageProducts(
        List<JsonNode> products,
        String language,
        boolean loadFullDetails
    ) {
        if (products == null || products.isEmpty()) {
            return PageSyncResult.empty();
        }

        List<String> activeCodes = new ArrayList<>();
        List<String> inactiveCodes = new ArrayList<>();
        Map<String, JsonNode> fallbackProducts = new HashMap<>();

        for (JsonNode product : products) {
            String code = text(product, "productCode");
            if (!isNotBlank(code)) continue;
            String status = normalize(text(product, "status"));
            if ("INACTIVE".equalsIgnoreCase(status)) {
                inactiveCodes.add(code);
            } else {
                activeCodes.add(code);
                fallbackProducts.put(code, product);
            }
        }

        // Load full details via HTTP (no transaction — avoids holding DB connection during API calls)
        Map<String, JsonNode> fullProducts = loadFullDetails
            ? loadFullProducts(activeCodes, language)
            : Map.of();

        List<JsonNode> activeProducts = activeCodes.stream()
            .map(code -> fullProducts.getOrDefault(code, fallbackProducts.get(code)))
            .filter(p -> p != null && !p.isNull())
            .toList();

        // Single short transaction for all DB writes on this page
        return self.batchPersistPage(activeProducts, inactiveCodes, language);
    }

    /**
     * Short write transaction: batch-upserts all active products and deactivates inactive ones.
     * N+1 → 4 queries for a full page (batch SELECT + batch INSERT + batch SELECT affil + batch INSERT affil).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PageSyncResult batchPersistPage(
        List<JsonNode> activeProducts,
        List<String> inactiveCodes,
        String language
    ) {
        Instant now = Instant.now();
        int created = 0, updated = 0, deactivated = 0, errors = 0;
        List<String> errorMessages = new ArrayList<>();

        if (!activeProducts.isEmpty()) {
            List<String> activeCodes = activeProducts.stream()
                .map(p -> text(p, "productCode"))
                .filter(this::isNotBlank)
                .distinct()
                .toList();

            Map<String, Experience> existingByCode = experienceRepository
                .findByProviderAndLocaleAndExternalIdIn(PROVIDER, language, activeCodes)
                .stream()
                .collect(Collectors.toMap(Experience::getExternalId, e -> e));

            List<Experience> toSave = new ArrayList<>();
            for (JsonNode product : activeProducts) {
                String code = text(product, "productCode");
                if (!isNotBlank(code)) {
                    errors++;
                    addError(errorMessages, "Skipped product without productCode");
                    continue;
                }
                boolean isNew = !existingByCode.containsKey(code);
                Experience exp = existingByCode.getOrDefault(code, new Experience());
                productMapper.updateExperience(exp, product, now);
                exp.setLocale(language);
                applyDestinationCityLabel(exp);
                toSave.add(exp);
                if (isNew) created++; else updated++;
            }

            List<Experience> saved = experienceRepository.saveAll(toSave);
            batchUpsertAffiliationLinks(saved);
        }

        if (!inactiveCodes.isEmpty()) {
            List<Experience> toDeactivate = experienceRepository
                .findByProviderAndLocaleAndExternalIdIn(PROVIDER, language, inactiveCodes);
            toDeactivate.forEach(e -> {
                e.setIsActive(false);
                e.setLastSyncedAt(now);
            });
            experienceRepository.saveAll(toDeactivate);
            deactivated = toDeactivate.size();
        }

        return new PageSyncResult(created, updated, deactivated, errors, errorMessages);
    }

    private void batchUpsertAffiliationLinks(List<Experience> saved) {
        List<UUID> ids = saved.stream()
            .map(Experience::getId)
            .filter(Objects::nonNull)
            .toList();
        if (ids.isEmpty()) return;

        Map<UUID, AffiliationLink> existingByExpId = affiliationLinkRepository
            .findByExperience_IdInAndProviderIgnoreCase(ids, PROVIDER)
            .stream()
            .collect(Collectors.toMap(l -> l.getExperience().getId(), l -> l));

        List<AffiliationLink> toSave = new ArrayList<>();
        for (Experience exp : saved) {
            if (exp.getId() == null || !isNotBlank(exp.getBookingUrl())) continue;
            AffiliationLink link = existingByExpId.getOrDefault(exp.getId(), new AffiliationLink());
            link.setExperience(exp);
            link.setProvider(PROVIDER);
            link.setUrl(exp.getBookingUrl().trim());
            toSave.add(link);
        }
        if (!toSave.isEmpty()) {
            affiliationLinkRepository.saveAll(toSave);
        }
    }

    private FallbackSyncResult syncUsingSearchFallback(
        int maxPages,
        int requestedCount,
        String language
    ) {
        return syncUsingSearchFallback(
            maxPages,
            requestedCount,
            language,
            resolveDestinationIds()
        );
    }

    private FallbackSyncResult syncUsingSearchFallback(
        int maxPages,
        int requestedCount,
        String language,
        List<String> destinationIds
    ) {
        int pagesProcessed = 0;
        int productsSeen = 0;
        int created = 0;
        int updated = 0;
        int deactivated = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        if (destinationIds.isEmpty()) {
            errors++;
            addError(errorMessages, "Fallback search unavailable: no destinations configured in backoffice");
            return new FallbackSyncResult(
                pagesProcessed,
                productsSeen,
                created,
                updated,
                deactivated,
                errors,
                errorMessages
            );
        }
        log.info("Fallback /products/search active for {} destinations (maxPages={})",
            destinationIds.size(), maxPages);

        int searchCount = Math.min(Math.max(requestedCount, 1), 50);
        Map<String, Integer> nextStartByDestination = new HashMap<>();
        Set<String> completedDestinations = new HashSet<>();

        while (pagesProcessed < maxPages && completedDestinations.size() < destinationIds.size()) {
            for (String destinationId : destinationIds) {
                if (pagesProcessed >= maxPages) {
                    break;
                }
                if (completedDestinations.contains(destinationId)) {
                    continue;
                }

                int start = nextStartByDestination.getOrDefault(destinationId, 1);
                Optional<ViatorProductSearchPage> searchPageOpt = viatorClient.searchProductsByDestination(
                    destinationId,
                    start,
                    searchCount,
                    "EUR",
                    language
                );
                if (searchPageOpt.isEmpty()) {
                    errors++;
                    addError(errorMessages, "Fallback search failed for destinationId=" + destinationId);
                    completedDestinations.add(destinationId);
                    continue;
                }

                ViatorProductSearchPage searchPage = searchPageOpt.get();
                List<JsonNode> products = searchPage.products() != null ? searchPage.products() : List.of();
                pagesProcessed++;
                productsSeen += products.size();

                PageSyncResult pageResult = processPageProducts(products, language, false);
                created += pageResult.created();
                updated += pageResult.updated();
                deactivated += pageResult.deactivated();
                errors += pageResult.errors();
                pageResult.errorMessages().forEach(msg -> addError(errorMessages, msg));

                if (products.isEmpty()) {
                    completedDestinations.add(destinationId);
                    continue;
                }

                if (searchPage.totalCount() > 0 && start + searchCount > searchPage.totalCount()) {
                    completedDestinations.add(destinationId);
                    continue;
                }
                if (products.size() < searchCount) {
                    completedDestinations.add(destinationId);
                    continue;
                }

                nextStartByDestination.put(destinationId, start + searchCount);
            }
        }

        return new FallbackSyncResult(
            pagesProcessed,
            productsSeen,
            created,
            updated,
            deactivated,
            errors,
            errorMessages
        );
    }

    private List<String> resolveDestinationIds() {
        return viatorDestinationRefService.listEnabledDestinationRefs();
    }

    private List<String> resolveNearbyDestinationRefs(double latitude, double longitude, String language) {
        String locationKey = nearbyLocationKey(latitude, longitude);
        Instant now = Instant.now();
        NearbyDestinationCacheEntry cached = nearbyDestinationCache.get(locationKey);
        int cacheMinutes = Math.max(viatorConfig.getSync().getNearbyResyncMinutes(), 1);
        if (
            cached != null
                && cached.resolvedAt().plus(cacheMinutes, ChronoUnit.MINUTES).isAfter(now)
                && !cached.destinationRefs().isEmpty()
        ) {
            return cached.destinationRefs();
        }

        List<String> refs = nearbyDestinationResolver.resolveDestinationRefs(
            latitude,
            longitude,
            language,
            viatorConfig.getSync().getNearbyMaxDestinations()
        );

        if (refs.isEmpty()) {
            refs = resolveDestinationIds()
                .stream()
                .limit(Math.max(viatorConfig.getSync().getNearbyMaxDestinations(), 1))
                .toList();
        }
        nearbyDestinationCache.put(locationKey, new NearbyDestinationCacheEntry(refs, now));
        return refs;
    }

    private boolean shouldSyncNearbyDestination(String destinationRef, Instant now) {
        Instant lastSync = nearbyDestinationLastSync.get(destinationRef);
        if (lastSync == null) {
            return true;
        }
        int resyncMinutes = Math.max(viatorConfig.getSync().getNearbyResyncMinutes(), 1);
        return lastSync.plus(resyncMinutes, ChronoUnit.MINUTES).isBefore(now);
    }

    private void markNearbyDestinationsSynced(List<String> destinationRefs, Instant syncedAt) {
        if (destinationRefs == null || destinationRefs.isEmpty()) {
            return;
        }
        destinationRefs.forEach(ref -> nearbyDestinationLastSync.put(ref, syncedAt));
    }

    private String nearbyLocationKey(double latitude, double longitude) {
        // Bucket da ~1km per ridurre chiamate duplicate per posizioni molto vicine.
        double latBucket = Math.round(latitude * 100.0d) / 100.0d;
        double lngBucket = Math.round(longitude * 100.0d) / 100.0d;
        return latBucket + LOCATION_KEY_SEPARATOR + lngBucket;
    }

    private Map<String, JsonNode> loadFullProducts(List<String> activeCodes, String language) {
        Map<String, JsonNode> fullProducts = new HashMap<>();
        if (activeCodes == null || activeCodes.isEmpty()) {
            return fullProducts;
        }
        for (int i = 0; i < activeCodes.size(); i += BULK_SIZE) {
            List<String> chunk = activeCodes.subList(i, Math.min(i + BULK_SIZE, activeCodes.size()));
            List<JsonNode> products = viatorClient.getProductsBulk(chunk, language);
            for (JsonNode product : products) {
                String code = text(product, "productCode");
                if (isNotBlank(code)) {
                    fullProducts.put(code, product);
                }
            }
        }
        return fullProducts;
    }

    private void applyDestinationCityLabel(Experience experience) {
        String destinationRef = normalize(experience.getLocationName());
        if (destinationRef == null) {
            return;
        }
        String cityName = viatorDestinationRefService.resolveCityNameForRef(destinationRef);
        if (isNotBlank(cityName)) {
            experience.setLocationName(cityName);
        }
    }

    /** Normalize to short locale for DB (en-US -> en) so it matches frontend SUPPORTED_LOCALES. */
    private static String normalizeLocaleForStorage(String locale) {
        if (locale == null || locale.isBlank()) {
            return "en";
        }
        String s = locale.trim();
        int dash = s.indexOf('-');
        String shortCode = dash > 0 ? s.substring(0, dash) : s;
        shortCode = shortCode.toLowerCase(java.util.Locale.ROOT);
        return SYNC_LOCALES.contains(shortCode) ? shortCode : "en";
    }

    /** @param language locale for this sync run (e.g. en, it). Use null for legacy single scope. */
    private ExternalSyncState loadOrCreateState(String language) {
        String scope = isNotBlank(language) ? SCOPE + ":" + language : SCOPE;
        return syncStateRepository.findByProviderAndScope(PROVIDER, scope)
            .orElseGet(() -> {
                ExternalSyncState state = new ExternalSyncState();
                state.setProvider(PROVIDER);
                state.setScope(scope);
                return syncStateRepository.save(state);
            });
    }

    private Instant resolveModifiedSince(Instant requested, String cursor, Instant persisted) {
        if (requested != null) {
            return requested;
        }
        if (isNotBlank(cursor)) {
            return null;
        }
        if (persisted != null) {
            return persisted;
        }
        return Instant.now().minus(viatorConfig.getSync().getInitialLookbackHours(), ChronoUnit.HOURS);
    }

    private ViatorSyncResponse buildResponse(
        int pagesProcessed,
        int productsSeen,
        int created,
        int updated,
        int deactivated,
        int errors,
        String nextCursor,
        Instant effectiveModifiedSince,
        List<String> errorMessages
    ) {
        String message = String.format(
            "Sync Viator completata: %d prodotti, %d creati, %d aggiornati, %d disattivati, %d errori",
            productsSeen, created, updated, deactivated, errors
        );
        return new ViatorSyncResponse(
            pagesProcessed,
            productsSeen,
            created,
            updated,
            deactivated,
            errors,
            nextCursor,
            effectiveModifiedSince,
            errorMessages,
            message
        );
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        return value.asText();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }

    private void addError(List<String> errors, String message) {
        if (errors.size() < MAX_ERROR_MESSAGES) {
            errors.add(message);
        }
    }

    private String firstError(List<String> errors) {
        return errors == null || errors.isEmpty() ? null : errors.getFirst();
    }

    private record PageSyncResult(
        int created,
        int updated,
        int deactivated,
        int errors,
        List<String> errorMessages
    ) {
        static PageSyncResult empty() {
            return new PageSyncResult(0, 0, 0, 0, List.of());
        }
    }

    private record FallbackSyncResult(
        int pagesProcessed,
        int productsSeen,
        int created,
        int updated,
        int deactivated,
        int errors,
        List<String> errorMessages
    ) {}

    private record NearbyDestinationCacheEntry(
        List<String> destinationRefs,
        Instant resolvedAt
    ) {}
}
