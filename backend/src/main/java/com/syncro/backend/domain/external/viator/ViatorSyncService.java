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
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ViatorSyncService {

    private static final Logger log = LoggerFactory.getLogger(ViatorSyncService.class);
    private static final String PROVIDER = "VIATOR";
    private static final String SCOPE = "products";
    private static final int BULK_SIZE = 50;
    private static final int MAX_ERROR_MESSAGES = 50;
    private static final int MAX_DESTINATION_FALLBACK = 12;
    private static final String LOCATION_KEY_SEPARATOR = ":";

    private final ViatorClient viatorClient;
    private final ViatorConfig viatorConfig;
    private final ViatorNearbyDestinationResolver nearbyDestinationResolver;
    private final ViatorProductMapper productMapper;
    private final ExperienceRepository experienceRepository;
    private final AffiliationLinkRepository affiliationLinkRepository;
    private final ExternalSyncStateRepository syncStateRepository;
    private final Map<String, Instant> nearbyDestinationLastSync = new ConcurrentHashMap<>();
    private final Map<String, NearbyDestinationCacheEntry> nearbyDestinationCache = new ConcurrentHashMap<>();

    public ViatorSyncService(
        ViatorClient viatorClient,
        ViatorConfig viatorConfig,
        ViatorNearbyDestinationResolver nearbyDestinationResolver,
        ViatorProductMapper productMapper,
        ExperienceRepository experienceRepository,
        AffiliationLinkRepository affiliationLinkRepository,
        ExternalSyncStateRepository syncStateRepository
    ) {
        this.viatorClient = viatorClient;
        this.viatorConfig = viatorConfig;
        this.nearbyDestinationResolver = nearbyDestinationResolver;
        this.productMapper = productMapper;
        this.experienceRepository = experienceRepository;
        this.affiliationLinkRepository = affiliationLinkRepository;
        this.syncStateRepository = syncStateRepository;
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized NearbySyncResult syncNearbyForCoordinates(
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
            log.info("Sync Viator nearby: nessuna destination risolta per lat={}, lng={}", latitude, longitude);
            return NearbySyncResult.empty();
        }
        log.info("Sync Viator nearby: lat={}, lng={}, destinationRefs={}", latitude, longitude, destinationRefs);

        Instant now = Instant.now();
        List<String> destinationsToSync = destinationRefs.stream()
            .filter(ref -> shouldSyncNearbyDestination(ref, now))
            .toList();

        if (destinationsToSync.isEmpty()) {
            log.info("Sync Viator nearby: destinazioni già aggiornate recentemente, skip sync");
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
            log.error("Errore imprevisto durante sync Viator", ex);
            String detail = normalize(ex.getMessage());
            String message = "Errore imprevisto sync Viator";
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
                List.of("Viator API key non configurata")
            );
        }

        ExternalSyncState state = loadOrCreateState();
        if (command.resetCursor()) {
            state.setCursorValue(null);
            state.setCursorTs(null);
            state.setLastError(null);
            syncStateRepository.save(state);
        }

        int count = command.count() > 0 ? command.count() : viatorConfig.getSync().getDefaultCount();
        int maxPages = command.maxPages() > 0 ? command.maxPages() : viatorConfig.getSync().getDefaultMaxPages();
        String language = isNotBlank(command.language()) ? command.language() : viatorConfig.getDefaultLanguage();

        String cursor = normalize(state.getCursorValue());
        Instant effectiveModifiedSince = resolveModifiedSince(command.modifiedSince(), cursor, state.getCursorTs());
        Instant initialModifiedSince = effectiveModifiedSince;

        int pagesProcessed = 0;
        int productsSeen = 0;
        int created = 0;
        int updated = 0;
        int deactivated = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        log.info("Avvio sync Viator: count={}, maxPages={}, cursor={}, modifiedSince={}",
            count, maxPages, cursor, effectiveModifiedSince);

        if (viatorConfig.getSync().isUseSearchOnly()) {
            log.info("Sync Viator in modalità Basic: uso diretto fallback /products/search");

            FallbackSyncResult fallback = syncUsingSearchFallback(maxPages, count, language);
            pagesProcessed = fallback.pagesProcessed();
            productsSeen = fallback.productsSeen();
            created = fallback.created();
            updated = fallback.updated();
            deactivated = fallback.deactivated();
            errors = fallback.errors();
            fallback.errorMessages().forEach(msg -> addError(errorMessages, msg));

            cursor = null;
            state.setCursorValue(null);
            state.setCursorTs(Instant.now());
            state.setLastSuccessAt(Instant.now());
            state.setLastError(errors == 0 ? null : firstError(errorMessages));
            syncStateRepository.save(state);

            return buildResponse(
                pagesProcessed,
                productsSeen,
                created,
                updated,
                deactivated,
                errors,
                cursor,
                initialModifiedSince,
                errorMessages
            );
        }

        while (pagesProcessed < maxPages) {
            ViatorFetchResult fetchResult = viatorClient.getModifiedProducts(
                cursor,
                effectiveModifiedSince,
                count,
                language
            );

            if (fetchResult.endpointAccessDenied()) {
                addError(
                    errorMessages,
                    "Endpoint /products/modified-since non abilitato per questa key; fallback su /products/search"
                );

                FallbackSyncResult fallback = syncUsingSearchFallback(
                    Math.max(maxPages - pagesProcessed, 1),
                    count,
                    language
                );

                pagesProcessed += fallback.pagesProcessed();
                productsSeen += fallback.productsSeen();
                created += fallback.created();
                updated += fallback.updated();
                deactivated += fallback.deactivated();
                errors += fallback.errors();
                fallback.errorMessages().forEach(msg -> addError(errorMessages, msg));

                cursor = null;
                state.setCursorValue(null);
                state.setCursorTs(Instant.now());
                state.setLastSuccessAt(Instant.now());
                state.setLastError(errors == 0 ? null : firstError(errorMessages));
                syncStateRepository.save(state);
                break;
            }

            if (!fetchResult.isSuccess()) {
                errors++;
                addError(
                    errorMessages,
                    "Errore recupero pagina products/modified-since"
                        + (fetchResult.errorMessage() != null ? ": " + fetchResult.errorMessage() : "")
                );
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

            // Alla prima chiamata si usa modified-since; dalla seconda in poi solo cursor.
            effectiveModifiedSince = null;
        }

        return buildResponse(
            pagesProcessed,
            productsSeen,
            created,
            updated,
            deactivated,
            errors,
            cursor,
            initialModifiedSince,
            errorMessages
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
        List<String> errorMessages = new ArrayList<>();
        int errors = 0;

        for (JsonNode product : products) {
            String code = text(product, "productCode");
            if (!isNotBlank(code)) {
                errors++;
                addError(errorMessages, "Prodotto senza productCode ignorato");
                continue;
            }
            String status = normalize(text(product, "status"));
            if ("INACTIVE".equalsIgnoreCase(status)) {
                inactiveCodes.add(code);
            } else {
                activeCodes.add(code);
                fallbackProducts.put(code, product);
            }
        }

        int created = 0;
        int updated = 0;
        int deactivated = 0;
        Instant now = Instant.now();

        Map<String, JsonNode> fullProducts = loadFullDetails
            ? loadFullProducts(activeCodes, language)
            : Map.of();
        for (String code : activeCodes) {
            JsonNode product = fullProducts.getOrDefault(code, fallbackProducts.get(code));
            if (product == null || product.isNull()) {
                errors++;
                addError(errorMessages, "Dettaglio prodotto non disponibile: " + code);
                continue;
            }
            try {
                UpsertResult result = upsertActiveProduct(product, now);
                if (result.created()) {
                    created++;
                } else if (result.updated()) {
                    updated++;
                }
            } catch (RuntimeException ex) {
                errors++;
                addError(errorMessages, "Errore upsert prodotto " + code + ": " + ex.getMessage());
            }
        }

        for (String code : inactiveCodes) {
            try {
                if (deactivateProduct(code, now)) {
                    deactivated++;
                }
            } catch (RuntimeException ex) {
                errors++;
                addError(errorMessages, "Errore disattivazione prodotto " + code + ": " + ex.getMessage());
            }
        }

        return new PageSyncResult(created, updated, deactivated, errors, errorMessages);
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
            resolveDestinationIds(language)
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
            addError(errorMessages, "Fallback search non disponibile: nessuna destination trovata");
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
        log.info("Fallback /products/search attivo su {} destinazioni (maxPages={})",
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
                    addError(errorMessages, "Fallback search fallita per destinationId=" + destinationId);
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

    private List<String> resolveDestinationIds(String language) {
        String configuredRefs = normalize(viatorConfig.getSync().getDestinationRefs());
        if (configuredRefs != null) {
            List<String> refs = new ArrayList<>();
            for (String item : configuredRefs.split(",")) {
                String ref = normalize(item);
                if (ref != null) {
                    refs.add(ref);
                }
            }
            if (!refs.isEmpty()) {
                return refs;
            }
        }
        return viatorClient.getDestinationIds(language, MAX_DESTINATION_FALLBACK);
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
            refs = resolveDestinationIds(language)
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

    @Transactional
    protected UpsertResult upsertActiveProduct(JsonNode product, Instant syncedAt) {
        String productCode = text(product, "productCode");
        if (!isNotBlank(productCode)) {
            throw new IllegalArgumentException("productCode mancante");
        }

        Optional<Experience> existingOpt = experienceRepository.findByProviderAndExternalId(PROVIDER, productCode);
        Experience experience = existingOpt.orElseGet(Experience::new);

        productMapper.updateExperience(experience, product, syncedAt);
        Experience saved = experienceRepository.save(experience);
        upsertAffiliationLink(saved, saved.getBookingUrl());

        if (existingOpt.isPresent()) {
            return new UpsertResult(false, true);
        }
        return new UpsertResult(true, false);
    }

    @Transactional
    protected boolean deactivateProduct(String productCode, Instant syncedAt) {
        Optional<Experience> existingOpt = experienceRepository.findByProviderAndExternalId(PROVIDER, productCode);
        if (existingOpt.isEmpty()) {
            return false;
        }
        Experience experience = existingOpt.get();
        experience.setIsActive(false);
        experience.setLastSyncedAt(syncedAt);
        experienceRepository.save(experience);
        return true;
    }

    private void upsertAffiliationLink(Experience experience, String url) {
        if (experience.getId() == null || !isNotBlank(url)) {
            return;
        }
        Optional<AffiliationLink> linkOpt = affiliationLinkRepository
            .findFirstByExperience_IdAndProviderIgnoreCase(experience.getId(), PROVIDER);

        AffiliationLink link = linkOpt.orElseGet(AffiliationLink::new);
        link.setExperience(experience);
        link.setProvider(PROVIDER);
        link.setUrl(url.trim());
        affiliationLinkRepository.save(link);
    }

    private ExternalSyncState loadOrCreateState() {
        return syncStateRepository.findByProviderAndScope(PROVIDER, SCOPE)
            .orElseGet(() -> {
                ExternalSyncState state = new ExternalSyncState();
                state.setProvider(PROVIDER);
                state.setScope(SCOPE);
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

    private record UpsertResult(boolean created, boolean updated) {}

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
