package com.syncro.backend.domain.zyra.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ExternalServiceException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.config.ZyraProperties;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.entity.PlaceTag;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.catalog.repository.PlaceTagRepository;
import com.syncro.backend.domain.profile.entity.ChildrenStatus;
import com.syncro.backend.domain.profile.entity.Orientation;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.RelationshipStatus;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.social.entity.ChatMessage;
import com.syncro.backend.domain.social.entity.ChatParticipant;
import com.syncro.backend.domain.social.repository.ChatMessageRepository;
import com.syncro.backend.domain.social.repository.ChatParticipantRepository;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.domain.tags.repository.TagRepository;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.domain.zyra.client.ZyraChatMessage;
import com.syncro.backend.domain.zyra.client.ZyraClient;
import com.syncro.backend.domain.zyra.cache.ZyraRecapCache;
import com.syncro.backend.domain.zyra.config.PromptLoader;
import com.syncro.backend.domain.zyra.config.PromptType;
import com.syncro.backend.domain.zyra.dto.ZyraChatResponse;
import com.syncro.backend.domain.zyra.dto.ZyraMessageRequest;
import com.syncro.backend.domain.zyra.dto.ZyraMessageResponse;
import com.syncro.backend.domain.zyra.dto.ZyraPlaceRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSessionResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionRequest;
import com.syncro.backend.domain.zyra.dto.ZyraBirthChartInterpretationRequest;
import com.syncro.backend.domain.zyra.dto.ZyraBirthChartInterpretationResponse;
import com.syncro.backend.domain.zyra.dto.ZyraTestRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraChatRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraProfileRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionResponse;
import com.syncro.backend.domain.zyra.entity.ProfileRecapPendingRefresh;
import com.syncro.backend.domain.zyra.entity.ZyraChatSession;
import com.syncro.backend.domain.zyra.entity.ZyraMessage;
import com.syncro.backend.domain.zyra.entity.ZyraMessageRole;
import com.syncro.backend.domain.zyra.entity.ZyraSuggestion;
import com.syncro.backend.domain.zyra.mapper.ZyraMapper;
import com.syncro.backend.domain.zyra.repository.ProfileRecapPendingRefreshRepository;
import com.syncro.backend.domain.zyra.repository.ZyraChatSessionRepository;
import com.syncro.backend.domain.zyra.repository.ZyraMessageRepository;
import com.syncro.backend.domain.zyra.repository.ZyraSuggestionRepository;
import com.syncro.backend.security.UserPrincipal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ZyraService {

    private static final Logger log = LoggerFactory.getLogger(ZyraService.class);

    /** Max distinct tests to include in profile recap (covers all standard insight types with headroom). */
    private static final int MAX_TEST_RECAPS = 8;

    /** Default recap when user has no completed tests and no birth chart (no LLM call). */
    private static final String DEFAULT_RECAP_NO_TESTS = "Complete your profile and take insight tests to see your personalized recap here.";
    private static final String DEFAULT_HIGHLIGHT_NO_TESTS = "Complete your profile and take tests to see your recap.";
    private static final int MAX_QUESTIONS_PER_TEST = 3;
    private static final int MAX_OPTIONS_PER_QUESTION = 2;
    private static final int MAX_QUESTION_TEXT = 80;
    private static final Set<String> SUPPORTED_RECAP_LANGUAGES = Set.of("en", "it", "es", "fr", "sq", "pt");

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserInterestRepository userInterestRepository;
    private final UserPsyProfileRepository userPsyProfileRepository;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final PlaceRepository placeRepository;
    private final PlaceTagRepository placeTagRepository;
    private final TagRepository tagRepository;
    private final ZyraRecapCache recapCache;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ZyraChatSessionRepository sessionRepository;
    private final ZyraMessageRepository messageRepository;
    private final ZyraSuggestionRepository suggestionRepository;
    private final ProfileRecapPendingRefreshRepository profileRecapPendingRefreshRepository;
    private final ZyraClient zyraClient;
    private final ZyraMapper zyraMapper;
    private final ObjectMapper objectMapper;
    private final int maxHistory;
    private final PromptLoader promptLoader;

    public ZyraService(
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        UserInterestRepository userInterestRepository,
        UserPsyProfileRepository userPsyProfileRepository,
        UserTestSubmissionRepository userTestSubmissionRepository,
        UserTestAnswerRepository userTestAnswerRepository,
        PlaceRepository placeRepository,
        PlaceTagRepository placeTagRepository,
        TagRepository tagRepository,
        ZyraRecapCache recapCache,
        ChatParticipantRepository chatParticipantRepository,
        ChatMessageRepository chatMessageRepository,
        ZyraChatSessionRepository sessionRepository,
        ZyraMessageRepository messageRepository,
        ZyraSuggestionRepository suggestionRepository,
        ProfileRecapPendingRefreshRepository profileRecapPendingRefreshRepository,
        ZyraClient zyraClient,
        ZyraMapper zyraMapper,
        ObjectMapper objectMapper,
        PromptLoader promptLoader,
        ZyraProperties zyraProperties
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userInterestRepository = userInterestRepository;
        this.userPsyProfileRepository = userPsyProfileRepository;
        this.userTestSubmissionRepository = userTestSubmissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.placeRepository = placeRepository;
        this.placeTagRepository = placeTagRepository;
        this.tagRepository = tagRepository;
        this.recapCache = recapCache;
        this.chatParticipantRepository = chatParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.suggestionRepository = suggestionRepository;
        this.profileRecapPendingRefreshRepository = profileRecapPendingRefreshRepository;
        this.zyraClient = zyraClient;
        this.zyraMapper = zyraMapper;
        this.objectMapper = objectMapper;
        this.maxHistory = zyraProperties.maxHistory();
        this.promptLoader = promptLoader;
    }

    @Transactional
    public ZyraSessionResponse createSession(UserPrincipal principal) {
        User user = getUser(principal);
        ZyraChatSession session = new ZyraChatSession();
        session.setUser(user);
        ZyraChatSession saved = sessionRepository.save(session);
        return zyraMapper.toSessionResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ZyraSessionResponse> getSessions(UserPrincipal principal, int page, int size) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return sessionRepository.findByUserId(user.getId(), pageable)
            .map(zyraMapper::toSessionResponse);
    }

    @Transactional(readOnly = true)
    public Page<ZyraMessageResponse> getMessages(
        UserPrincipal principal,
        UUID sessionId,
        int page,
        int size
    ) {
        User user = getUser(principal);
        ZyraChatSession session = getSession(user.getId(), sessionId);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return messageRepository.findBySessionId(session.getId(), pageable)
            .map(zyraMapper::toMessageResponse);
    }

    @Transactional
    public void deleteSession(UserPrincipal principal, UUID sessionId) {
        User user = getUser(principal);
        ZyraChatSession session = getSession(user.getId(), sessionId);
        sessionRepository.delete(session);
    }

    @Transactional
    public void deleteAllSessions(UserPrincipal principal) {
        User user = getUser(principal);
        sessionRepository.deleteByUserId(user.getId());
    }

    @Transactional
    public ZyraChatResponse sendMessage(
        UserPrincipal principal,
        UUID sessionId,
        ZyraMessageRequest request
    ) {
        User user = getUser(principal);
        ZyraChatSession session = getSession(user.getId(), sessionId);
        String content = normalizeRequired(request.content());

        ZyraMessage userMessage = new ZyraMessage();
        userMessage.setSession(session);
        userMessage.setRole(ZyraMessageRole.USER);
        userMessage.setContent(content);
        ZyraMessage savedUserMessage = messageRepository.save(userMessage);

        String sessionTitle = session.getTitle();
        if (sessionTitle == null || sessionTitle.isBlank()) {
            String fallbackTitle = buildFallbackTitle(content);
            session.setTitle(fallbackTitle);
            sessionRepository.save(session);
            sessionTitle = fallbackTitle;

            String firstMessage = content;
            UUID sessionIdForAsync = session.getId();
            String titleLanguage = resolveResponseLanguage(user);
            CompletableFuture.runAsync(() -> {
                String generatedTitle = generateSessionTitle(firstMessage, titleLanguage);
                if (generatedTitle != null && !generatedTitle.isBlank()) {
                    sessionRepository.findById(sessionIdForAsync).ifPresent(s -> {
                        s.setTitle(generatedTitle);
                        sessionRepository.save(s);
                    });
                }
            });
        }

        List<ZyraChatMessage> promptMessages = buildPromptMessages(user, session.getId());
        String responseLanguage = resolveResponseLanguage(user);
        String assistantReply = zyraClient.chat(withLanguageGuard(promptMessages, responseLanguage));

        ZyraMessage assistantMessage = new ZyraMessage();
        assistantMessage.setSession(session);
        assistantMessage.setRole(ZyraMessageRole.ASSISTANT);
        assistantMessage.setContent(assistantReply);
        ZyraMessage savedAssistantMessage = messageRepository.save(assistantMessage);

        return new ZyraChatResponse(
            zyraMapper.toMessageResponse(savedUserMessage),
            zyraMapper.toMessageResponse(savedAssistantMessage),
            sessionTitle
        );
    }

    @Transactional(readOnly = true)
    public Page<ZyraSuggestionResponse> getSuggestions(UserPrincipal principal, int page, int size) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return suggestionRepository.findByUserId(user.getId(), pageable)
            .map(zyraMapper::toSuggestionResponse);
    }

    @Transactional
    public ZyraSuggestionResponse createSuggestion(
        UserPrincipal principal,
        ZyraSuggestionRequest request
    ) {
        User user = getUser(principal);
        String context = normalizeOptional(request.context());
        String prompt = buildSuggestionPrompt(request, context);
        List<ZyraChatMessage> messages = buildSuggestionMessages(user, prompt);
        String responseLanguage = resolveResponseLanguage(user);
        String reply = zyraClient.chat(withLanguageGuard(messages, responseLanguage));

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", reply);
        if (context != null) {
            payload.put("context", context);
        }

        ZyraSuggestion suggestion = new ZyraSuggestion();
        suggestion.setUser(user);
        suggestion.setSuggestionType(request.suggestionType());
        suggestion.setPayload(payload);

        ZyraSuggestion saved = suggestionRepository.save(suggestion);
        return zyraMapper.toSuggestionResponse(saved);
    }

    @Transactional(readOnly = true)
    public ZyraProfileRecapResponse getProfileRecap(UserPrincipal principal, String requestLanguage) {
        User user = getUser(principal);
        String preferredLanguage = resolvePreferredLanguageForRecap(user, requestLanguage);
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null && isNotBlank(profile.getZyraRecap())) {
            java.time.Instant generatedAt = profile.getUpdatedAt() != null
                ? profile.getUpdatedAt()
                : java.time.Instant.now();
            List<String> highlights = parseHighlightsFromJson(profile.getZyraRecapHighlights());
            return new ZyraProfileRecapResponse(
                localizeRecap(profile.getZyraRecap(), preferredLanguage, user.getLanguage()),
                highlights,
                generatedAt
            );
        }
        return recapCache.getProfileRecap(user.getId())
            .map(entry -> profileRecapFromCachePayload(entry.recap(), preferredLanguage, user.getLanguage(), entry.generatedAt()))
            .orElseGet(() -> {
                ProfileRecapResult result = generateProfileRecap(user, requestLanguage);
                java.time.Instant generatedAt = java.time.Instant.now();
                recapCache.putProfileRecap(user.getId(), profileRecapToCachePayload(result), generatedAt);
                return new ZyraProfileRecapResponse(
                    localizeRecap(result.fullRecap(), preferredLanguage, preferredLanguage),
                    result.highlights() != null ? result.highlights() : List.of(),
                    generatedAt
                );
            });
    }

    /**
     * Regenerate profile recap and persist it (cache + DB).
     * Called automatically after completing a test or saving a birth chart so the recap is up to date without clicking Regenerate.
     */
    @Transactional
    public void refreshProfileRecap(User user) {
        if (user == null || user.getId() == null) {
            return;
        }
        try {
            ProfileRecapResult result = generateProfileRecap(user);
            if (result == null || result.fullRecap() == null || result.fullRecap().isBlank()) {
                return;
            }
            String fullRecap = result.fullRecap().trim();
            java.time.Instant generatedAt = java.time.Instant.now();
            recapCache.putProfileRecap(user.getId(), profileRecapToCachePayload(result), generatedAt);
            UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
            if (profile != null) {
                profile.setZyraRecap(fullRecap);
                profile.setZyraRecapHighlights(highlightsToJson(result.highlights()));
                userProfileRepository.save(profile);
            }
        } catch (Exception ex) {
            // Avoid blocking profile/test saves, but keep the failure observable.
            log.warn("Unable to refresh Zyra profile recap for userId={}: {}", user.getId(), ex.getMessage(), ex);
        }
    }

    /**
     * Force-regenerate the profile recap (skips stored DB/cache), updates profile.zyraRecap and cache, returns the new recap.
     * Use this when the user explicitly clicks "Regenerate" so they get a fresh summary without labels.
     */
    @Transactional
    public ZyraProfileRecapResponse regenerateProfileRecap(UserPrincipal principal, String requestLanguage) {
        User user = getUser(principal);
        String preferredLanguage = resolvePreferredLanguageForRecap(user, requestLanguage);
        recapCache.invalidateUser(user.getId());
        ProfileRecapResult result = generateProfileRecap(user, requestLanguage);
        java.time.Instant generatedAt = java.time.Instant.now();
        recapCache.putProfileRecap(user.getId(), profileRecapToCachePayload(result), generatedAt);
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null) {
            profile.setZyraRecap(result.fullRecap() != null ? result.fullRecap().trim() : null);
            profile.setZyraRecapHighlights(highlightsToJson(result.highlights()));
            userProfileRepository.save(profile);
        }
        clearPendingRecapRefresh(user.getId());
        return new ZyraProfileRecapResponse(
            localizeRecap(result.fullRecap(), preferredLanguage, preferredLanguage),
            result.highlights() != null ? result.highlights() : List.of(),
            generatedAt
        );
    }

    /** Called when user completes a test; frontend will call regenerate on next profile visit when this is true. */
    @Transactional
    public void setPendingRecapRefresh(UUID userId) {
        ProfileRecapPendingRefresh row = profileRecapPendingRefreshRepository.findById(userId)
            .orElseGet(() -> {
                ProfileRecapPendingRefresh e = new ProfileRecapPendingRefresh();
                e.setUserId(userId);
                return e;
            });
        row.setPendingRefresh(true);
        profileRecapPendingRefreshRepository.save(row);
    }

    @Transactional(readOnly = true)
    public boolean isPendingRecapRefresh(UUID userId) {
        return profileRecapPendingRefreshRepository.findById(userId)
            .map(ProfileRecapPendingRefresh::isPendingRefresh)
            .orElse(false);
    }

    @Transactional
    public void clearPendingRecapRefresh(UUID userId) {
        profileRecapPendingRefreshRepository.findById(userId).ifPresent(row -> {
            row.setPendingRefresh(false);
            profileRecapPendingRefreshRepository.save(row);
        });
    }

    /**
     * Clears stored profile recap (cache + DB) so the next request regenerates from current data.
     * Call when the user resets insights so they do not keep seeing the old recap.
     */
    @Transactional
    public void clearProfileRecapForUser(User user) {
        if (user == null || user.getId() == null) {
            return;
        }
        recapCache.invalidateUser(user.getId());
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null) {
            profile.setZyraRecap(null);
            profile.setZyraRecapHighlights(null);
            userProfileRepository.save(profile);
        }
    }

    @Transactional(readOnly = true)
    public ZyraProfileRecapResponse getProfileRecapForUser(UserPrincipal principal, UUID userId, String requestLanguage) {
        User requester = getUser(principal);
        String preferredLanguage = resolvePreferredLanguageForRecap(requester, requestLanguage);
        if (userId == null) {
            throw new NotFoundException("Invalid user");
        }
        User target = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        ensureProfilePublic(target.getId());
        UserProfile targetProfile = userProfileRepository.findByUserId(target.getId()).orElse(null);
        if (targetProfile != null && isNotBlank(targetProfile.getZyraRecap())) {
            java.time.Instant generatedAt = targetProfile.getUpdatedAt() != null
                ? targetProfile.getUpdatedAt()
                : java.time.Instant.now();
            List<String> highlights = parseHighlightsFromJson(targetProfile.getZyraRecapHighlights());
            return new ZyraProfileRecapResponse(
                localizeRecap(targetProfile.getZyraRecap(), preferredLanguage, target.getLanguage()),
                highlights,
                generatedAt
            );
        }
        return recapCache.getProfileRecap(target.getId())
            .map(entry -> profileRecapFromCachePayload(entry.recap(), preferredLanguage, target.getLanguage(), entry.generatedAt()))
            .orElseGet(() -> {
                ProfileRecapResult result = generateProfileRecap(target, requestLanguage);
                java.time.Instant generatedAt = java.time.Instant.now();
                recapCache.putProfileRecap(target.getId(), profileRecapToCachePayload(result), generatedAt);
                return new ZyraProfileRecapResponse(
                    localizeRecap(result.fullRecap(), preferredLanguage, preferredLanguage),
                    result.highlights() != null ? result.highlights() : List.of(),
                    generatedAt
                );
            });
    }

    @Transactional(readOnly = true)
    public ZyraPlaceRecapResponse getPlaceRecap(UserPrincipal principal, UUID placeId, String requestLanguage) {
        User user = getUser(principal);
        String fromRequest = resolvePreferredLanguageForRecap(user, requestLanguage);
        final String preferredLanguage = (fromRequest != null && !fromRequest.isBlank())
            ? fromRequest
            : resolvePreferredLanguage(user);
        if (placeId == null) {
            throw new NotFoundException("Invalid place");
        }
        Place place = placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Place not found"));
        return recapCache.getPlaceRecap(user.getId(), placeId)
            .map(entry -> new ZyraPlaceRecapResponse(
                localizeRecap(entry.recap(), preferredLanguage),
                entry.generatedAt()
            ))
            .orElseGet(() -> {
                String responseLanguage = (requestLanguage != null && !requestLanguage.isBlank())
                    ? normalizeLanguageCode(requestLanguage)
                    : resolveResponseLanguage(user);
                String recap = generatePlaceRecap(user, place, responseLanguage);
                java.time.Instant generatedAt = java.time.Instant.now();
                recapCache.putPlaceRecap(user.getId(), placeId, recap, generatedAt);
                return new ZyraPlaceRecapResponse(
                    localizeRecap(recap, preferredLanguage),
                    generatedAt
                );
            });
    }

    private ProfileRecapResult generateProfileRecap(User user) {
        return generateProfileRecap(user, null);
    }

    private ProfileRecapResult generateProfileRecap(User user, String responseLanguageOverride) {
        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        UserProfile userProfile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        List<String> testSummaries = buildTestSummaries(user);

        // Add birth chart summary when completed (birth chart is stored in UserProfile, not as a test submission)
        String birthChartSummary = buildBirthChartSummary(userProfile);
        if (birthChartSummary != null) {
            testSummaries = new ArrayList<>(testSummaries != null ? testSummaries : List.of());
            testSummaries.add(birthChartSummary);
        }

        if (testSummaries == null || testSummaries.isEmpty()) {
            return new ProfileRecapResult(
                List.of(DEFAULT_HIGHLIGHT_NO_TESTS),
                DEFAULT_RECAP_NO_TESTS
            );
        }

        // Recap must be exclusively test results: no profile fields (name, location, job, interests, astro, etc.)
        // and no labels (Balanced Planner, etc.) — so we only send test summaries, scores, and sanitized dimensions.
        StringBuilder prompt = new StringBuilder(promptLoader.getPrompt(PromptType.PROFILE_RECAP));
        prompt.append("\n");

        prompt.append("- Completed tests (summary by test):\n");
        testSummaries.forEach(summary -> prompt.append("  - ").append(summary).append("\n"));

        // Psychological profile is derived from the same tests; send for context without duplicating paragraphs recap must not show percentages (plain language only)
        if (psyProfile != null && psyProfile.getProfile() != null && !psyProfile.getProfile().isEmpty()) {
            Map<String, Object> sanitized = sanitizeProfileForRecap(psyProfile.getProfile());
            if (!sanitized.isEmpty()) {
                prompt.append("- Psychological profile (scores only; no labels): ").append(safeJson(sanitized)).append("\n");
            }
        }
        prompt.append("\nRespond with a single JSON object only, no other text. Use exactly: {\"highlights\": [\"...\"], \"fullRecap\": \"...\"}. RULES: (1) highlights: exactly one short line per completed test/category above, in order: values, objectives, psychological, lifestyle, interests, birth chart. Each highlight = one phrase, max 15 words. (2) fullRecap: one flowing sentence per test (do not add a separate paragraph for psychological profile), then one short paragraph for birth chart if present. First person. Use the response language.");

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", promptLoader.getPrompt(PromptType.PROFILE_RECAP_SYSTEM)),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String responseLanguage = (responseLanguageOverride != null && !responseLanguageOverride.isBlank())
                ? responseLanguageOverride.trim().toLowerCase(Locale.ROOT)
                : resolveResponseLanguage(user);
            String raw = zyraClient.chat(withLanguageGuard(messages, responseLanguage));
            if (raw == null || raw.isBlank()) {
                throw new ExternalServiceException("Zyra returned an empty profile recap response");
            }
            return parseProfileRecapResponse(raw.trim());
        } catch (ExternalServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ExternalServiceException("Unable to generate profile recap", ex);
        }
    }

    private static String truncateForHighlight(String text, int maxWords) {
        if (text == null || text.isBlank()) return "";
        String[] words = text.trim().split("\\s+");
        if (words.length <= maxWords) return text.trim();
        return String.join(" ", java.util.Arrays.copyOf(words, maxWords));
    }

    private ProfileRecapResult parseProfileRecapResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ExternalServiceException("Zyra returned an empty profile recap payload");
        }
        String jsonPayload = extractFirstJsonObject(raw.trim());
        if (jsonPayload == null) {
            throw new ExternalServiceException("Zyra profile recap response did not contain a valid JSON object");
        }
        try {
            JsonNode root = objectMapper.readTree(jsonPayload);
            if (root == null || !root.isObject()) {
                throw new ExternalServiceException("Zyra profile recap response was not a JSON object");
            }

            List<String> highlights = new ArrayList<>();
            JsonNode highlightsNode = root.path("highlights");
            if (highlightsNode.isArray()) {
                for (JsonNode item : highlightsNode) {
                    if (item != null && item.isValueNode()) {
                        String value = item.asText(null);
                        if (value != null && !value.isBlank()) {
                            highlights.add(value.trim());
                        }
                    }
                }
            }

            String fullRecap = sanitizeRecapFromLabels(root.path("fullRecap").asText(""));
            if (fullRecap == null) {
                fullRecap = "";
            }

            if (fullRecap.isBlank() && highlights.isEmpty()) {
                throw new ExternalServiceException("Zyra profile recap JSON was missing both highlights and fullRecap");
            }
            if (highlights.isEmpty()) {
                highlights = List.of(truncateForHighlight(fullRecap, 15));
            }
            if (fullRecap.isBlank()) {
                fullRecap = String.join(" ", highlights);
            }
            return new ProfileRecapResult(highlights, fullRecap);
        } catch (JsonProcessingException ex) {
            throw new ExternalServiceException("Unable to parse Zyra profile recap JSON", ex);
        }
    }

    private String extractFirstJsonObject(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        int start = -1;
        int depth = 0;
        boolean inString = false;
        boolean escaping = false;

        for (int i = 0; i < raw.length(); i++) {
            char ch = raw.charAt(i);

            if (inString) {
                if (escaping) {
                    escaping = false;
                } else if (ch == '\\') {
                    escaping = true;
                } else if (ch == '"') {
                    inString = false;
                }
                continue;
            }

            if (ch == '"') {
                inString = true;
                continue;
            }
            if (ch == '{') {
                if (depth == 0) {
                    start = i;
                }
                depth++;
                continue;
            }
            if (ch == '}') {
                if (depth == 0) {
                    continue;
                }
                depth--;
                if (depth == 0 && start >= 0) {
                    return raw.substring(start, i + 1);
                }
            }
        }
        return null;
    }

    private record ProfileRecapResult(List<String> highlights, String fullRecap) {}

    private String profileRecapToCachePayload(ProfileRecapResult result) {
        try {
            return objectMapper.writeValueAsString(Map.of("h", result.highlights() != null ? result.highlights() : List.of(), "r", result.fullRecap() != null ? result.fullRecap() : ""));
        } catch (JsonProcessingException e) {
            return result.fullRecap() != null ? result.fullRecap() : "";
        }
    }

    private ZyraProfileRecapResponse profileRecapFromCachePayload(String payload, String preferredLanguage, String sourceLanguage, java.time.Instant generatedAt) {
        if (payload == null || payload.isBlank()) {
            return new ZyraProfileRecapResponse("", List.of(), generatedAt != null ? generatedAt : java.time.Instant.now());
        }
        java.time.Instant at = generatedAt != null ? generatedAt : java.time.Instant.now();
        if (payload.trim().startsWith("{")) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = objectMapper.readValue(payload, Map.class);
                List<String> h = map.get("h") instanceof List<?> list
                    ? list.stream().filter(Objects::nonNull).map(Object::toString).map(String::trim).filter(s -> !s.isBlank()).toList()
                    : List.of();
                String r = map.get("r") != null ? map.get("r").toString() : payload;
                return new ZyraProfileRecapResponse(
                    localizeRecap(r, preferredLanguage, sourceLanguage),
                    h,
                    at
                );
            } catch (JsonProcessingException ignored) {
                // fallback: treat as legacy recap-only string
            }
        }
        return new ZyraProfileRecapResponse(
            localizeRecap(payload, preferredLanguage, sourceLanguage),
            List.of(),
            at
        );
    }

    private List<String> parseHighlightsFromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            List<?> list = objectMapper.readValue(json, List.class);
            return list.stream().filter(Objects::nonNull).map(Object::toString).map(String::trim).filter(s -> !s.isBlank()).toList();
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String highlightsToJson(List<String> highlights) {
        if (highlights == null || highlights.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(highlights);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private List<String> buildTestSummaries(User user) {
        if (user == null || user.getId() == null) {
            return List.of();
        }
        List<UserTestSubmission> submissions = userTestSubmissionRepository
            .findByUser_IdOrderBySubmittedAtDesc(user.getId());
        if (submissions.isEmpty()) {
            return List.of();
        }
        Map<UUID, UserTestSubmission> latestByTest = new LinkedHashMap<>();
        for (UserTestSubmission submission : submissions) {
            if (submission == null || submission.getTestDefinition() == null) {
                continue;
            }
            UUID testId = submission.getTestDefinition().getId();
            if (testId == null || latestByTest.containsKey(testId)) {
                continue;
            }
            latestByTest.put(testId, submission);
            // Include all completed tests in profile recap; cap only to avoid unbounded prompt size
            if (latestByTest.size() >= MAX_TEST_RECAPS) {
                break;
            }
        }
        if (latestByTest.isEmpty()) {
            return List.of();
        }
        List<UserTestSubmission> latestSubmissions = new ArrayList<>(latestByTest.values());
        List<UUID> submissionIds = latestSubmissions.stream()
            .map(UserTestSubmission::getId)
            .filter(id -> id != null)
            .toList();
        Map<UUID, List<UserTestAnswer>> answersBySubmission = submissionIds.isEmpty()
            ? Map.of()
            : userTestAnswerRepository.findBySubmission_IdIn(submissionIds).stream()
                .collect(Collectors.groupingBy(answer -> answer.getSubmission().getId()));

        List<String> summaries = new ArrayList<>();
        for (UserTestSubmission submission : latestSubmissions) {
            List<UserTestAnswer> answers = answersBySubmission.getOrDefault(submission.getId(), List.of());
            String summary = buildTestSummary(submission, answers);
            if (summary != null && !summary.isBlank()) {
                summaries.add(summary);
            }
        }
        return summaries;
    }

    private String buildTestSummary(UserTestSubmission submission, List<UserTestAnswer> answers) {
        if (submission == null) {
            return null;
        }
        String title = submission.getTestDefinition() != null
            ? normalizeOptional(submission.getTestDefinition().getTitle())
            : null;
        String answersSummary = buildAnswersSummary(answers);

        StringBuilder summary = new StringBuilder();
        summary.append(title != null ? title : "Test");
        if (answersSummary != null) {
            summary.append(": ");
            summary.append("Key answers: ").append(answersSummary);
        }
        return summary.toString();
    }

    /**
     * Builds a birth chart summary for the profile recap when completed.
     * Matches UserProfileMapper.hasBirthChart: birthDate set and (interpretation not blank or sunSign set).
     */
    private String buildBirthChartSummary(UserProfile profile) {
        if (profile == null || profile.getBirthDate() == null) {
            return null;
        }
        boolean hasInterpretation = profile.getZyraBirthChartInterpretation() != null
            && !profile.getZyraBirthChartInterpretation().isBlank();
        boolean hasSunSign = profile.getSunSign() != null;
        if (!hasInterpretation && !hasSunSign) {
            return null;
        }
        StringBuilder summary = new StringBuilder("Birth chart: ");
        if (profile.getSunSign() != null) {
            summary.append("Sun sign ").append(formatZodiacSign(profile.getSunSign()));
        }
        if (hasInterpretation) {
            String interpretation = profile.getZyraBirthChartInterpretation().trim();
            if (interpretation.length() > 300) {
                interpretation = interpretation.substring(0, 297) + "...";
            }
            if (profile.getSunSign() != null) {
                summary.append("; ");
            }
            summary.append("Interpretation: ").append(interpretation);
        }
        return summary.toString();
    }

    private String buildAnswersSummary(List<UserTestAnswer> answers) {
        if (answers == null || answers.isEmpty()) {
            return null;
        }
        List<QuestionSummary> summaries = summarizeAnswers(answers);
        if (summaries.isEmpty()) {
            return null;
        }
        return summaries.stream()
            .limit(MAX_QUESTIONS_PER_TEST)
            .map(summary -> {
                String question = shortenText(normalizeOptional(summary.question()), MAX_QUESTION_TEXT);
                String options = summary.options().stream()
                    .filter(option -> option != null && !option.isBlank())
                    .limit(MAX_OPTIONS_PER_QUESTION)
                    .collect(Collectors.joining(", "));
                if (options.isBlank()) {
                    return null;
                }
                return question != null ? question + " -> " + options : options;
            })
            .filter(value -> value != null && !value.isBlank())
            .collect(Collectors.joining("; "));
    }

    private List<QuestionSummary> summarizeAnswers(List<UserTestAnswer> answers) {
        Map<UUID, QuestionSummaryBuilder> builders = new HashMap<>();
        for (UserTestAnswer answer : answers) {
            if (answer == null || answer.getQuestion() == null || answer.getAnswerOption() == null) {
                continue;
            }
            UUID questionId = answer.getQuestion().getId();
            if (questionId == null) {
                continue;
            }
            String questionText = normalizeOptional(answer.getQuestion().getQuestion());
            int position = answer.getQuestion().getPosition();
            String optionLabel = normalizeOptional(answer.getAnswerOption().getLabel());
            if (optionLabel == null) {
                continue;
            }
            QuestionSummaryBuilder builder = builders.computeIfAbsent(
                questionId,
                id -> new QuestionSummaryBuilder(questionText, position)
            );
            builder.addOption(optionLabel);
        }
        return builders.values().stream()
            .sorted(Comparator.comparingInt(QuestionSummaryBuilder::position))
            .map(QuestionSummaryBuilder::toSummary)
            .toList();
    }

    private String shortenText(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        int safeLength = Math.max(0, maxLength - 3);
        return trimmed.substring(0, safeLength) + "...";
    }

    private record QuestionSummary(String question, int position, List<String> options) {
    }

    private static final class QuestionSummaryBuilder {
        private final String question;
        private final int position;
        private final LinkedHashSet<String> options = new LinkedHashSet<>();

        private QuestionSummaryBuilder(String question, int position) {
            this.question = question;
            this.position = position;
        }

        private void addOption(String option) {
            if (option != null && !option.isBlank()) {
                options.add(option.trim());
            }
        }

        private int position() {
            return position;
        }

        private QuestionSummary toSummary() {
            return new QuestionSummary(question, position, new ArrayList<>(options));
        }
    }

    private String generatePlaceRecap(User user, Place place) {
        return generatePlaceRecap(user, place, resolveResponseLanguage(user));
    }

    private String generatePlaceRecap(User user, Place place, String responseLanguage) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        List<String> placeTags = loadPlaceTags(place.getId());

        StringBuilder prompt = new StringBuilder(promptLoader.getPrompt(PromptType.PLACE_RECAP));
        prompt.append("\n");

        if (profile != null) {
            if (profile.getFullName() != null && !profile.getFullName().isBlank()) {
                prompt.append("- Name: ").append(profile.getFullName()).append("\n");
            }
            if (profile.getCity() != null && !profile.getCity().isBlank()) {
                prompt.append("- City: ").append(profile.getCity()).append("\n");
            }
            if (profile.getCountry() != null && !profile.getCountry().isBlank()) {
                prompt.append("- Country: ").append(profile.getCountry()).append("\n");
            }
            if (profile.getBirthDate() != null) {
                prompt.append("- Age: ").append(formatAge(profile.getBirthDate())).append(" years\n");
            }
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                prompt.append("- Job: ").append(jobLabel).append("\n");
            }
            appendExtendedProfileInfo(prompt, profile);
            if (!hasExtendedProfile(profile) && profile.getBio() != null && !profile.getBio().isBlank()) {
                prompt.append("- Bio: ").append(profile.getBio()).append("\n");
            }
        }

        if (!interests.isEmpty()) {
            String interestNames = interests.stream()
                .map(interest -> interest.getTag() != null ? interest.getTag().getName() : null)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!interestNames.isBlank()) {
                prompt.append("- Interests: ").append(interestNames).append("\n");
            }
        }

        // Aggregated scores from tests
        if (psyProfile != null) {
            StringBuilder scores = new StringBuilder();
            if (psyProfile.getLifestyleScore() != null) {
                scores.append("Lifestyle: ").append(psyProfile.getLifestyleScore()).append("%, ");
            }
            if (psyProfile.getValuesScore() != null) {
                scores.append("Values: ").append(psyProfile.getValuesScore()).append("%, ");
            }
            if (psyProfile.getPsyScore() != null) {
                scores.append("Personality: ").append(psyProfile.getPsyScore()).append("%");
            }
            String scoresStr = scores.toString().replaceAll(", $", "");
            if (!scoresStr.isBlank()) {
                prompt.append("- Personality profile: ").append(scoresStr).append("\n");
            }
        }

        // Gender for context
        if (profile != null && profile.getGender() != null) {
            prompt.append("- Gender: ").append(formatGender(profile.getGender())).append("\n");
        }

        prompt.append("Place data:\n");
        prompt.append("- Name: ").append(place.getName()).append("\n");
        if (place.getCategory() != null && place.getCategory().getName() != null) {
            prompt.append("- Category: ").append(place.getCategory().getName()).append("\n");
        }
        if (place.getDescription() != null && !place.getDescription().isBlank()) {
            prompt.append("- Description: ").append(place.getDescription()).append("\n");
        }
        if (place.getCity() != null && !place.getCity().isBlank()) {
            prompt.append("- City: ").append(place.getCity()).append("\n");
        }
        if (place.getAddress() != null && !place.getAddress().isBlank()) {
            prompt.append("- Address: ").append(place.getAddress()).append("\n");
        }
        if (!placeTags.isEmpty()) {
            prompt.append("- Tags: ").append(String.join(", ", placeTags)).append("\n");
        }
        if (place.getGoogleTypes() != null && !place.getGoogleTypes().isEmpty()) {
            String types = place.getGoogleTypes().stream()
                .filter(type -> type != null && !type.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!types.isBlank()) {
                prompt.append("- Google types: ").append(types).append("\n");
            }
        }
        if (place.getGoogleRating() != null) {
            prompt.append("- Google rating: ").append(place.getGoogleRating()).append("\n");
        }
        if (place.getGoogleReviewCount() != null && place.getGoogleReviewCount() > 0) {
            prompt.append("- Reviews: ").append(place.getGoogleReviewCount()).append("\n");
        }
        if (place.getPriceLevel() != null) {
            prompt.append("- Price: ").append(formatPriceLevel(place.getPriceLevel())).append("\n");
        }
        Boolean openNow = extractOpenNow(place.getOpeningHours());
        if (openNow != null) {
            prompt.append("- Current status: ").append(openNow ? "Open now" : "Closed now").append("\n");
        }

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", promptLoader.getPrompt(PromptType.PLACE_RECAP_SYSTEM)),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String effectiveLanguage = (responseLanguage != null && !responseLanguage.isBlank())
                ? responseLanguage.trim().toLowerCase(Locale.ROOT)
                : resolveResponseLanguage(user);
            String recap = zyraClient.chat(withLanguageGuard(messages, effectiveLanguage));
            return recap != null ? recap.trim() : "Interesting place: update your profile for a more accurate match.";
        } catch (Exception ex) {
            return "Interesting place: update your profile for a more accurate match.";
        }
    }

    @Transactional(readOnly = true)
    public ZyraChatRecapResponse getChatRecap(UserPrincipal principal) {
        User user = getUser(principal);
        String preferredLanguage = resolvePreferredLanguage(user);
        ZyraChatRecapResponse response = recapCache.getChatRecap(user.getId())
            .orElseGet(() -> buildChatRecap(user));
        String localizedRecap = localizeRecap(response.recap(), preferredLanguage, user.getLanguage());
        if (Objects.equals(localizedRecap, response.recap())) {
            return response;
        }
        return new ZyraChatRecapResponse(
            localizedRecap,
            response.conversationCount(),
            response.recentContacts(),
            response.generatedAt()
        );
    }

    @Transactional(readOnly = true)
    public ZyraTestRecapResponse getTestRecap(UserPrincipal principal, UUID submissionId) {
        User user = getUser(principal);
        String preferredLanguage = resolvePreferredLanguage(user);
        if (submissionId == null) {
            throw new BadRequestException("Invalid submission ID");
        }
        UserTestSubmission submission = userTestSubmissionRepository.findById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        if (!submission.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Not authorized to view this test");
        }
        String recap = generateTestRecap(submission);
        String localizedRecap = localizeRecap(recap, preferredLanguage, user.getLanguage());
        String testTitle = submission.getTestDefinition() != null
            ? submission.getTestDefinition().getTitle()
            : "Test";
        String testType = submission.getTestDefinition() != null
            ? submission.getTestDefinition().getTestType().name()
            : "OTHER";
        return new ZyraTestRecapResponse(
            submissionId,
            testTitle,
            testType,
            localizedRecap,
            java.time.Instant.now()
        );
    }

    /**
     * Zyra translates numeric birth chart placements into human-readable sentences. No calculations; interpretation only.
     */
    @Transactional(readOnly = true)
    public ZyraBirthChartInterpretationResponse interpretBirthChart(
        UserPrincipal principal,
        ZyraBirthChartInterpretationRequest request,
        String requestLanguage
    ) {
        User user = getUser(principal);
        String responseLanguage = resolvePreferredLanguageForRecap(user, requestLanguage);
        if (responseLanguage == null || responseLanguage.isBlank()) {
            responseLanguage = resolveResponseLanguage(user);
        }
        String placementsText = buildBirthChartPlacementsText(request);
        String userPrompt = promptLoader.getPrompt(
            PromptType.BIRTH_CHART_INTERPRETATION_USER,
            Map.of("placements", placementsText)
        );
        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", promptLoader.getPrompt(PromptType.BIRTH_CHART_INTERPRETATION_SYSTEM)),
            new ZyraChatMessage("user", userPrompt)
        );
        try {
            String interpretation = zyraClient.chat(withLanguageGuard(messages, responseLanguage));
            String text = interpretation != null ? interpretation.trim() : "";
            return new ZyraBirthChartInterpretationResponse(text);
        } catch (Exception ex) {
            return new ZyraBirthChartInterpretationResponse("");
        }
    }

    private static String buildBirthChartPlacementsText(ZyraBirthChartInterpretationRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Sun: ").append(req.sun().sign()).append(" ").append(String.format("%.1f", req.sun().degreeInSign())).append("°\n");
        sb.append("Moon: ").append(req.moon().sign()).append(" ").append(String.format("%.1f", req.moon().degreeInSign())).append("°\n");
        if (req.ascendant() != null) {
            sb.append("Ascendant: ").append(req.ascendant().sign()).append(" ").append(String.format("%.1f", req.ascendant().degreeInSign())).append("°\n");
        }
        sb.append("Venus: ").append(req.venus().sign()).append(" ").append(String.format("%.1f", req.venus().degreeInSign())).append("°\n");
        sb.append("Mars: ").append(req.mars().sign()).append(" ").append(String.format("%.1f", req.mars().degreeInSign())).append("°");
        return sb.toString();
    }

    private String generateTestRecap(UserTestSubmission submission) {
        if (submission == null || submission.getTestDefinition() == null) {
            return "Test completed. Complete more tests for a richer profile.";
        }
        List<UserTestAnswer> answers = userTestAnswerRepository.findBySubmission_Id(submission.getId());
        String testTitle = normalizeOptional(submission.getTestDefinition().getTitle());
        String testDescription = normalizeOptional(submission.getTestDefinition().getDescription());
        String testType = submission.getTestDefinition().getTestType().name();

        StringBuilder prompt = new StringBuilder(promptLoader.getPrompt(PromptType.TEST_RECAP));
        prompt.append("\n\n");

        prompt.append("Test information:\n");
        prompt.append("- Title: ").append(testTitle != null ? testTitle : "Test").append("\n");
        if (testDescription != null) {
            prompt.append("- Description: ").append(testDescription).append("\n");
        }
        prompt.append("- Type: ").append(formatTestType(testType)).append("\n\n");

        if (answers.isEmpty()) {
            prompt.append("The user completed the test but no answers were recorded.\n");
        } else {
            prompt.append("User answers:\n");
            Map<UUID, List<UserTestAnswer>> answersByQuestion = answers.stream()
                .filter(a -> a.getQuestion() != null && a.getAnswerOption() != null)
                .collect(Collectors.groupingBy(a -> a.getQuestion().getId()));

            List<Map.Entry<UUID, List<UserTestAnswer>>> sortedEntries = answersByQuestion.entrySet().stream()
                .sorted(Comparator.comparingInt(e -> e.getValue().get(0).getQuestion().getPosition()))
                .toList();

            for (Map.Entry<UUID, List<UserTestAnswer>> entry : sortedEntries) {
                List<UserTestAnswer> questionAnswers = entry.getValue();
                if (questionAnswers.isEmpty()) continue;
                String questionText = normalizeOptional(questionAnswers.get(0).getQuestion().getQuestion());
                String selectedOptions = questionAnswers.stream()
                    .map(a -> normalizeOptional(a.getAnswerOption().getLabel()))
                    .filter(label -> label != null)
                    .collect(Collectors.joining(", "));
                if (questionText != null && !selectedOptions.isEmpty()) {
                    prompt.append("- ").append(questionText).append(" -> ").append(selectedOptions).append("\n");
                }
            }
        }

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", promptLoader.getPrompt(PromptType.TEST_RECAP_SYSTEM)),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            User submissionUser = submission.getUser();
            String responseLanguage = submissionUser != null ? resolveResponseLanguage(submissionUser) : "en";
            String recap = zyraClient.chat(withLanguageGuard(messages, responseLanguage));
            return recap != null ? recap.trim() : "Great job! You completed the test successfully.";
        } catch (Exception ex) {
            return "Great job! You completed the test successfully.";
        }
    }

    private String formatTestType(String testType) {
        if (testType == null) return "General";
        return switch (testType) {
            case "INTERESTS" -> "Interests and passions";
            case "LIFESTYLE" -> "Lifestyle";
            case "VALUES" -> "Personal values";
            case "OBJECTIVES" -> "Life goals";
            case "PSY" -> "Psychological profile";
            case "ASTRO" -> "Astrology";
            default -> "General";
        };
    }

    private ZyraChatRecapResponse buildChatRecap(User user) {
        // Get user's recent conversations (last 5)
        PageRequest pageable = PageRequest.of(0, 5, Sort.by(Sort.Order.desc("createdAt")));
        List<ChatParticipant> participants = chatParticipantRepository.findByUserId(user.getId(), pageable).getContent();

        if (participants.isEmpty()) {
            ZyraChatRecapResponse response = new ZyraChatRecapResponse(
                "You don't have any conversations yet. Start chatting to see a recap here.",
                0,
                List.of(),
                java.time.Instant.now()
            );
            recapCache.putChatRecap(user.getId(), response);
            return response;
        }

        List<UUID> conversationIds = participants.stream()
            .map(ChatParticipant::getConversationId)
            .toList();

        // Build conversation summaries for prompt
        StringBuilder conversationData = new StringBuilder();
        List<String> recentContacts = new ArrayList<>();

        for (UUID conversationId : conversationIds) {
            // Get other participant name
            List<ChatParticipant> convParticipants = chatParticipantRepository.findAllByConversationId(conversationId);
            ChatParticipant otherParticipant = convParticipants.stream()
                .filter(p -> !p.getUserId().equals(user.getId()))
                .findFirst()
                .orElse(null);

            String otherName = "User";
            if (otherParticipant != null) {
                UserProfile otherProfile = userProfileRepository.findByUserId(otherParticipant.getUserId()).orElse(null);
                if (otherProfile != null && otherProfile.getFullName() != null) {
                    otherName = otherProfile.getFullName();
                }
            }
            recentContacts.add(otherName);

            // Get last 5 messages from this conversation
            PageRequest msgPageable = PageRequest.of(0, 5, Sort.by(Sort.Order.desc("createdAt")));
            List<ChatMessage> messages = chatMessageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, msgPageable).getContent();

            if (!messages.isEmpty()) {
                conversationData.append("Conversation with ").append(otherName).append(":\n");
                List<ChatMessage> orderedMessages = new ArrayList<>(messages);
                Collections.reverse(orderedMessages);
                for (ChatMessage msg : orderedMessages) {
                    String sender = msg.getUser().getId().equals(user.getId()) ? "You" : otherName;
                    String content = msg.getContent().length() > 100
                        ? msg.getContent().substring(0, 100) + "..."
                        : msg.getContent();
                    conversationData.append("- ").append(sender).append(": ").append(content).append("\n");
                }
                conversationData.append("\n");
            }
        }

        String recap = generateChatRecap(user, conversationData.toString(), conversationIds.size());

        ZyraChatRecapResponse response = new ZyraChatRecapResponse(
            recap,
            conversationIds.size(),
            recentContacts,
            java.time.Instant.now()
        );
        recapCache.putChatRecap(user.getId(), response);
        return response;
    }

    private String generateChatRecap(User user, String conversationData, int conversationCount) {
        if (conversationData.isBlank()) {
            return "Your conversations are still empty. Start exchanging messages!";
        }

        StringBuilder prompt = new StringBuilder(promptLoader.getPrompt(PromptType.CHAT_RECAP));
        prompt.append("\n\n");
        prompt.append(conversationData);

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", promptLoader.getPrompt(PromptType.CHAT_RECAP_SYSTEM)),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String responseLanguage = user != null ? resolveResponseLanguage(user) : "en";
            String recap = zyraClient.chat(withLanguageGuard(messages, responseLanguage));
            return recap != null ? recap.trim() : "You have " + conversationCount + " active conversations.";
        } catch (Exception ex) {
            return "You have " + conversationCount + " active conversations.";
        }
    }

    private List<ZyraChatMessage> buildPromptMessages(User user, UUID sessionId) {
        List<ZyraChatMessage> messages = new ArrayList<>();
        messages.add(new ZyraChatMessage("system", buildSystemPrompt(user)));

        PageRequest pageable = PageRequest.of(0, maxHistory, Sort.by(Sort.Order.desc("createdAt")));
        List<ZyraMessage> history = messageRepository.findBySessionId(sessionId, pageable).getContent();
        if (!history.isEmpty()) {
            List<ZyraMessage> ordered = new ArrayList<>(history);
            Collections.reverse(ordered); // cronologico
            for (ZyraMessage message : ordered) {
                messages.add(new ZyraChatMessage(mapRole(message.getRole()), message.getContent()));
            }
        }
        return messages;
    }

    private List<ZyraChatMessage> buildSuggestionMessages(User user, String prompt) {
        List<ZyraChatMessage> messages = new ArrayList<>();
        messages.add(new ZyraChatMessage("system", buildSystemPrompt(user)));
        messages.add(new ZyraChatMessage("user", prompt));
        return messages;
    }

    private String buildSystemPrompt(User user) {
        String basePrompt = promptLoader.getPrompt(PromptType.SYSTEM_BASE);
        String userContext = buildUserContextLines(user);
        String contextPrompt = promptLoader.getPrompt(
            PromptType.CHAT_CONTEXT_TEMPLATE,
            Map.of("userContext", userContext)
        );
        StringBuilder builder = new StringBuilder(basePrompt);
        if (!basePrompt.endsWith("\n")) {
            builder.append("\n");
        }
        builder.append(contextPrompt);
        return builder.toString();
    }

    private String buildUserContextLines(User user) {
        StringBuilder builder = new StringBuilder();
        builder.append("- language: ").append(safeValue(user.getLanguage())).append("\n");

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null) {
            builder.append("- name: ").append(safeValue(profile.getFullName())).append("\n");
            builder.append("- city: ").append(safeValue(profile.getCity())).append("\n");
            builder.append("- country: ").append(safeValue(profile.getCountry())).append("\n");
            builder.append("- age: ").append(formatAge(profile.getBirthDate())).append("\n");
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                builder.append("- job: ").append(jobLabel).append("\n");
            }
            appendExtendedProfileInfo(builder, profile);
            if (!hasExtendedProfile(profile) && profile.getBio() != null && !profile.getBio().isBlank()) {
                builder.append("- bio: ").append(profile.getBio()).append("\n");
            }
        }

        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        if (!interests.isEmpty()) {
            String interestNames = interests.stream()
                .map(interest -> interest.getTag() != null ? interest.getTag().getName() : null)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!interestNames.isBlank()) {
                builder.append("- interests: ").append(interestNames).append("\n");
            }
        }

        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        if (psyProfile != null && psyProfile.getProfile() != null && !psyProfile.getProfile().isEmpty()) {
            Map<String, Object> sanitized = sanitizeProfileForRecap(psyProfile.getProfile());
            if (!sanitized.isEmpty()) {
                builder.append("- psychological_profile: ")
                    .append(safeJson(sanitized))
                    .append("\n");
            }
        }

        if (psyProfile != null) {
            StringBuilder scores = new StringBuilder();
            if (psyProfile.getInterestsScore() != null) {
                scores.append("interests:").append(psyProfile.getInterestsScore()).append("% ");
            }
            if (psyProfile.getLifestyleScore() != null) {
                scores.append("lifestyle:").append(psyProfile.getLifestyleScore()).append("% ");
            }
            if (psyProfile.getValuesScore() != null) {
                scores.append("values:").append(psyProfile.getValuesScore()).append("% ");
            }
            if (psyProfile.getObjectivesScore() != null) {
                scores.append("objectives:").append(psyProfile.getObjectivesScore()).append("% ");
            }
            if (psyProfile.getPsyScore() != null) {
                scores.append("psy:").append(psyProfile.getPsyScore()).append("% ");
            }
            if (psyProfile.getAstroScore() != null) {
                scores.append("astro:").append(psyProfile.getAstroScore()).append("%");
            }
            String scoresStr = scores.toString().trim();
            if (!scoresStr.isBlank()) {
                builder.append("- test_scores: ").append(scoresStr).append("\n");
            }
        }

        if (profile != null) {
            StringBuilder astro = new StringBuilder();
            if (profile.getZodiacSign() != null) {
                astro.append(formatZodiacSign(profile.getZodiacSign())).append(" ");
            }
            if (profile.getAscSign() != null) {
                astro.append("asc:").append(formatZodiacSign(profile.getAscSign())).append(" ");
            }
            if (profile.getMoonSign() != null) {
                astro.append("moon:").append(formatZodiacSign(profile.getMoonSign()));
            }
            String astroStr = astro.toString().trim();
            if (!astroStr.isBlank()) {
                builder.append("- signs: ").append(astroStr).append("\n");
            }
            if (profile.getGender() != null) {
                builder.append("- gender: ").append(formatGender(profile.getGender())).append("\n");
            }
        }

        return builder.toString().trim();
    }

    private String buildSuggestionPrompt(ZyraSuggestionRequest request, String context) {
        String contextBlock = context != null ? "Additional context: " + context : "";
        return promptLoader.getPrompt(
            PromptType.SUGGESTION_BASE,
            Map.of(
                "suggestionType", request.suggestionType().name(),
                "contextBlock", contextBlock
            )
        );
    }

    private String mapRole(ZyraMessageRole role) {
        if (role == null) {
            return "user";
        }
        return switch (role) {
            case USER -> "user";
            case ASSISTANT -> "assistant";
            case SYSTEM -> "system";
        };
    }

    private String normalizeRequired(String value) {
        if (value == null) {
            throw new BadRequestException("Invalid content");
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Invalid content");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private List<String> loadPlaceTags(UUID placeId) {
        if (placeId == null) {
            return Collections.emptyList();
        }
        List<PlaceTag> links = placeTagRepository.findAllByPlaceId(placeId);
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> tagIds = links.stream()
            .map(PlaceTag::getTagId)
            .filter(id -> id != null)
            .distinct()
            .toList();
        if (tagIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Tag> tags = tagRepository.findAllById(tagIds);
        return tags.stream()
            .map(Tag::getName)
            .filter(name -> name != null && !name.isBlank())
            .distinct()
            .collect(Collectors.toList());
    }

    private String formatPriceLevel(Integer level) {
        if (level == null) {
            return null;
        }
        return switch (level) {
            case 0 -> "Free";
            case 1 -> "Budget";
            case 2 -> "Moderate";
            case 3 -> "Expensive";
            case 4 -> "Very expensive";
            default -> "Not available";
        };
    }

    private Boolean extractOpenNow(Map<String, Object> openingHours) {
        if (openingHours == null || openingHours.isEmpty()) {
            return null;
        }
        Object openNow = openingHours.get("openNow");
        if (openNow instanceof Boolean value) {
            return value;
        }
        return null;
    }

    private String buildJobLabel(UserProfile profile) {
        if (profile == null) {
            return null;
        }
        String title = normalizeOptional(profile.getJobTitle());
        String company = normalizeOptional(profile.getCompanyName());
        if (title == null && company == null) {
            return null;
        }
        if (title != null && company != null) {
            return title + " @ " + company;
        }
        return title != null ? title : company;
    }

    private boolean hasExtendedProfile(UserProfile profile) {
        if (profile == null) {
            return false;
        }
        return isNotBlank(profile.getTraitsText())
            || isNotBlank(profile.getLovesText())
            || isNotBlank(profile.getDislikesText())
            || isNotBlank(profile.getGoalsText())
            || isNotBlank(profile.getValuesText())
            || profile.getRelationshipStatus() != null
            || profile.getOrientation() != null
            || profile.getChildrenStatus() != null;
    }

    private void appendExtendedProfileInfo(StringBuilder builder, UserProfile profile) {
        if (profile == null) {
            return;
        }
        if (isNotBlank(profile.getTraitsText())) {
            builder.append("- What defines me: ").append(profile.getTraitsText()).append("\n");
        }
        if (isNotBlank(profile.getLovesText())) {
            builder.append("- What I love: ").append(profile.getLovesText()).append("\n");
        }
        if (isNotBlank(profile.getDislikesText())) {
            builder.append("- What I dislike: ").append(profile.getDislikesText()).append("\n");
        }
        if (isNotBlank(profile.getGoalsText())) {
            builder.append("- What I am looking for: ").append(profile.getGoalsText()).append("\n");
        }
        if (isNotBlank(profile.getValuesText())) {
            builder.append("- Values: ").append(profile.getValuesText()).append("\n");
        }
        if (profile.getRelationshipStatus() != null) {
            builder.append("- Relationship status: ")
                .append(formatRelationshipStatus(profile.getRelationshipStatus()))
                .append("\n");
        }
        if (profile.getOrientation() != null) {
            builder.append("- Orientation: ")
                .append(formatOrientation(profile.getOrientation()))
                .append("\n");
        }
        if (profile.getChildrenStatus() != null) {
            builder.append("- Children: ")
                .append(formatChildrenStatus(profile.getChildrenStatus()))
                .append("\n");
        }
    }

    private String formatRelationshipStatus(RelationshipStatus status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case SINGLE -> "Single";
            case IN_RELATIONSHIP -> "In a relationship";
            case MARRIED -> "Married";
            case SEPARATED -> "Separated";
            case COMPLICATED -> "It's complicated";
            case OTHER -> "Other";
        };
    }

    private String formatOrientation(Orientation orientation) {
        if (orientation == null) {
            return "";
        }
        return switch (orientation) {
            case HETERO -> "Straight";
            case GAY -> "Gay";
            case BI -> "Bisexual";
            case ASEXUAL -> "Asexual";
            case OTHER -> "Other";
        };
    }

    private String formatChildrenStatus(ChildrenStatus status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case NO_CHILDREN -> "No children";
            case HAS_CHILDREN -> "Has children";
            case WANTS_CHILDREN -> "Wants children";
            case DOES_NOT_WANT -> "Does not want children";
            case UNDECIDED -> "Undecided";
        };
    }

    private String formatZodiacSign(com.syncro.backend.domain.profile.entity.ZodiacSign sign) {
        if (sign == null) {
            return "";
        }
        return switch (sign) {
            case ARIES -> "Aries";
            case TAURUS -> "Taurus";
            case GEMINI -> "Gemini";
            case CANCER -> "Cancer";
            case LEO -> "Leo";
            case VIRGO -> "Virgo";
            case LIBRA -> "Libra";
            case SCORPIO -> "Scorpio";
            case SAGITTARIUS -> "Sagittarius";
            case CAPRICORN -> "Capricorn";
            case AQUARIUS -> "Aquarius";
            case PISCES -> "Pisces";
            case UNKNOWN -> "Not specified";
        };
    }

    private String formatGender(com.syncro.backend.domain.profile.entity.Gender gender) {
        if (gender == null) {
            return "";
        }
        return switch (gender) {
            case MALE -> "Male";
            case FEMALE -> "Female";
            case NON_BINARY -> "Non-binary";
            case OTHER -> "Other";
            case PREFER_NOT_TO_SAY -> "Prefer not to say";
        };
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "n/d" : value;
    }

    private String formatAge(LocalDate birthDate) {
        if (birthDate == null) {
            return "n/d";
        }
        int years = java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
        return years > 0 ? String.valueOf(years) : "n/d";
    }

    private String safeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return payload.toString();
        }
    }

    /**
     * Returns a copy of the psychological profile suitable for recap generation:
     * dimension scores and confidence are kept; any "profile" sub-object (label, name, description)
     * is removed so the model does not receive or repeat invented type names like "Balanced Planner".
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> sanitizeProfileForRecap(Map<String, Object> profile) {
        if (profile == null || profile.isEmpty()) {
            return Map.of();
        }
        Map<String, Object> out = new HashMap<>();
        Object dimensionsObj = profile.get("dimensions");
        if (dimensionsObj instanceof Map<?, ?> dimensionsMap) {
            Map<String, Object> dimensions = (Map<String, Object>) dimensionsMap;
            Map<String, Object> sanitizedDimensions = new HashMap<>();
            for (Map.Entry<String, Object> entry : dimensions.entrySet()) {
                if (!(entry.getValue() instanceof Map<?, ?> dimMap)) {
                    continue;
                }
                Map<String, Object> dim = new HashMap<>((Map<String, Object>) dimMap);
                dim.remove("profile");
                sanitizedDimensions.put(entry.getKey(), dim);
            }
            out.put("dimensions", sanitizedDimensions);
        }
        return out;
    }

    private String generateSessionTitle(String firstUserMessage, String languageCode) {
        String prompt = promptLoader.getPrompt(PromptType.CHAT_SESSION_TITLE);
        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", prompt),
            new ZyraChatMessage("user", firstUserMessage)
        );
        String responseLanguage = (languageCode != null && !languageCode.isBlank()) ? languageCode.trim().toLowerCase(Locale.ROOT) : "en";
        try {
            String title = zyraClient.chat(withLanguageGuard(messages, responseLanguage));
            if (title == null) {
                return null;
            }
            String normalized = title.trim();
            return normalized.isBlank() ? null : normalized.substring(0, Math.min(normalized.length(), 64));
        } catch (Exception ex) {
            return null;
        }
    }

    private String buildFallbackTitle(String content) {
        if (content == null || content.isBlank()) {
            return "Chat with Zyra";
        }
        String trimmed = content.trim();
        return trimmed.length() > 48 ? trimmed.substring(0, 48) + "..." : trimmed;
    }

    private List<ZyraChatMessage> withLanguageGuard(List<ZyraChatMessage> messages, String languageCode) {
        String code = (languageCode != null && !languageCode.isBlank()) ? languageCode.trim().toLowerCase(Locale.ROOT) : "en";
        int separatorIndex = code.indexOf('-');
        if (separatorIndex > 0) {
            code = code.substring(0, separatorIndex);
        }
        String languageLabel = languageLabelForResponse(code);
        String instruction = "You must respond only in " + languageLabel + ". Use that language for every response.";
        if ("pt".equals(code)) {
            instruction += " Do not answer in English; the user's language is Portuguese.";
        }
        List<ZyraChatMessage> guarded = new ArrayList<>((messages != null ? messages.size() : 0) + 1);
        guarded.add(new ZyraChatMessage("system", instruction));
        if (messages != null && !messages.isEmpty()) {
            guarded.addAll(messages);
        }
        return guarded;
    }

    /**
     * Preferred language for AI responses (chat, recaps, suggestions). Uses the user's profile/app language
     * without restricting to recap-supported locales, so Zyra responds in the user's selected language.
     */
    private String resolveResponseLanguage(User user) {
        if (user == null || user.getLanguage() == null || user.getLanguage().isBlank()) {
            return "en";
        }
        String normalized = user.getLanguage().trim().toLowerCase(Locale.ROOT);
        int separatorIndex = normalized.indexOf('-');
        if (separatorIndex > 0) {
            normalized = normalized.substring(0, separatorIndex);
        }
        return normalized.isEmpty() ? "en" : normalized;
    }

    private String resolvePreferredLanguage(User user) {
        return user == null ? "en" : normalizeLanguageCode(user.getLanguage());
    }

    /** When requestLanguage is provided (e.g. from Accept-Language), use it for recap response; else use user's stored language. */
    private String resolvePreferredLanguageForRecap(User user, String requestLanguage) {
        if (requestLanguage != null && !requestLanguage.isBlank()) {
            return normalizeLanguageCode(requestLanguage);
        }
        return resolvePreferredLanguage(user);
    }

    /**
     * Human-readable language label for the response-language instruction. Used so the model replies in the correct language.
     * Unknown codes use a generic phrase so the model can still attempt the language; no hardcoded English fallback.
     */
    private String languageLabelForResponse(String languageCode) {
        if (languageCode == null || languageCode.isBlank()) {
            return "English";
        }
        return switch (languageCode) {
            case "en" -> "English";
            case "it" -> "Italian";
            case "es" -> "Spanish";
            case "fr" -> "French";
            case "sq" -> "Albanian";
            case "pt" -> "Portuguese (Português)";
            case "de" -> "German";
            case "nl" -> "Dutch";
            case "pl" -> "Polish";
            case "ru" -> "Russian";
            case "ar" -> "Arabic";
            case "hi" -> "Hindi";
            case "zh" -> "Chinese";
            case "ja" -> "Japanese";
            case "ko" -> "Korean";
            case "tr" -> "Turkish";
            default -> "the language with ISO code " + languageCode;
        };
    }

    private String normalizeLanguageCode(String languageCode) {
        if (languageCode == null || languageCode.isBlank()) {
            return "en";
        }
        String normalized = languageCode.trim().toLowerCase(Locale.ROOT);
        int separatorIndex = normalized.indexOf('-');
        if (separatorIndex > 0) {
            normalized = normalized.substring(0, separatorIndex);
        }
        return SUPPORTED_RECAP_LANGUAGES.contains(normalized) ? normalized : "en";
    }

    /**
     * Returns the recap in the viewer's language. Translates only when source and target languages differ;
     * when they match (e.g. both English), skips the LLM call to reduce latency, cost, and rate-limit risk.
     * Profile-type labels are stripped so they never appear (including in old or translated recaps).
     *
     * @param recap recap text (may be in any language)
     * @param targetLanguageCode viewer's preferred language (e.g. from request or user settings)
     * @param sourceLanguageCode language the recap is in, or null if unknown (when null, translation is always attempted)
     */
    private String localizeRecap(String recap, String targetLanguageCode, String sourceLanguageCode) {
        if (recap == null || recap.isBlank()) {
            return recap;
        }
        String targetLang = normalizeLanguageCode(targetLanguageCode);
        if (sourceLanguageCode != null && !sourceLanguageCode.isBlank()
            && targetLang.equals(normalizeLanguageCode(sourceLanguageCode))) {
            return sanitizeRecapFromLabels(recap);
        }
        String translated = translateRecap(recap, targetLang);
        return sanitizeRecapFromLabels(translated);
    }

    private String localizeRecap(String recap, String languageCode) {
        return localizeRecap(recap, languageCode, null);
    }

    /** Straight and curly double quotes so we match "Inclusive Innovator" and "Inclusive Innovator" etc. */
    private static final String QUOTES = "[\"\\u201C\\u201D\\u201E\\u201F]";

    /**
     * Public so the controller can guarantee every API response is sanitized (recap comes from DB, cache, or generation).
     */
    public String sanitizeRecapForResponse(String recap) {
        return sanitizeRecapFromLabels(recap);
    }

    /**
     * Removes or replaces known profile-type labels from recap text so they never appear to users.
     * Recap may come from database (user_profile.zyra_recap), cache, or fresh generation.
     */
    private String sanitizeRecapFromLabels(String recap) {
        if (recap == null || recap.isBlank()) {
            return recap;
        }
        String out = recap;
        // Remove "psychological results/test" wording so recap reflects only the tests the user took (Values, etc.)
        out = replaceLabel(out, "(?i)\\bMy psychological results suggest\\b", "My answers suggest");
        out = replaceLabel(out, "(?i)\\bpsychological results\\b", "test answers");
        out = replaceLabel(out, "(?i)\\bpsychological profile\\b", "profile");
        out = replaceLabel(out, "(?i)\\bpsychological test\\b", "test");
        // Literal first so we always catch exact phrases from DB/cache (no regex/encoding issues)
        out = out.replace("\"Inclusive Innovator\"", "oriented toward inclusion and innovation");
        out = out.replace("\"Balanced Planner\"", "oriented toward balanced planning");
        out = out.replace("Inclusive Innovator", "oriented toward inclusion and innovation");
        out = out.replace("Balanced Planner", "oriented toward balanced planning");
        // Regex for quoted/unquoted and other languages
        out = replaceLabel(out, "(?i)" + QUOTES + "?\\s*(an?\\s+)?Inclusive Innovator\\s*" + QUOTES + "?", "oriented toward inclusion and innovation");
        out = replaceLabel(out, "(?i)" + QUOTES + "?\\s*(an?\\s+)?Balanced Planner\\s*" + QUOTES + "?", "oriented toward balanced planning");
        out = replaceLabel(out, "(?i)" + QUOTES + "?\\s*(una?\\s+)?Innovatrice Inclusiva\\s*" + QUOTES + "?", "oriented toward inclusion and innovation");
        out = replaceLabel(out, "(?i)" + QUOTES + "?\\s*(una?\\s+)?Pianificatrice Equilibrata\\s*" + QUOTES + "?", "oriented toward balanced planning");
        out = replaceLabel(out, "(?i)" + QUOTES + "?\\s*Expansion phase\\s*" + QUOTES + "?", "focused on growth");
        out = replaceLabel(out, "(?i)\\b(an?\\s+)?Inclusive Innovator\\b", "oriented toward inclusion and innovation");
        out = replaceLabel(out, "(?i)\\b(an?\\s+)?Balanced Planner\\b", "oriented toward balanced planning");
        out = replaceLabel(out, "(?i)\\b(una?\\s+)?Innovatrice Inclusiva\\b", "oriented toward inclusion and innovation");
        out = replaceLabel(out, "(?i)\\b(una?\\s+)?Pianificatrice Equilibrata\\b", "oriented toward balanced planning");
        out = replaceLabel(out, "(?i)\\bExpansion phase\\b", "focused on growth");
        out = out.replaceAll("[ \\t]+", " ").trim();
        return out;
    }

    private static String replaceLabel(String text, String pattern, String replacement) {
        return Pattern.compile(pattern).matcher(text).replaceAll(Matcher.quoteReplacement(replacement));
    }

    private String translateRecap(String sourceRecap, String targetLanguage) {
        String targetLanguageLabel = mapLanguageLabel(targetLanguage);
        String translationInstruction = promptLoader.getPrompt(
            PromptType.RECAP_TRANSLATE_USER,
            Map.of("targetLanguage", targetLanguageLabel)
        );
        String userPrompt = translationInstruction
            + "\n\nRecap to translate:\n\"\"\"\n"
            + sourceRecap
            + "\n\"\"\"";

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", promptLoader.getPrompt(PromptType.RECAP_TRANSLATE_SYSTEM)),
            new ZyraChatMessage("user", userPrompt)
        );
        try {
            String translated = zyraClient.chat(messages);
            if (translated == null || translated.isBlank()) {
                return sourceRecap;
            }
            return translated.trim();
        } catch (Exception ex) {
            return sourceRecap;
        }
    }

    private String mapLanguageLabel(String languageCode) {
        return switch (normalizeLanguageCode(languageCode)) {
            case "it" -> "Italian";
            case "es" -> "Spanish";
            case "fr" -> "French";
            case "sq" -> "Albanian";
            case "pt" -> "Portuguese";
            default -> "English";
        };
    }

    private ZyraChatSession getSession(UUID userId, UUID sessionId) {
        if (sessionId == null) {
            throw new BadRequestException("Invalid session");
        }
        return sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new NotFoundException("Session not found"));
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Missing or invalid token");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void ensureProfilePublic(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            throw new NotFoundException("Profile unavailable");
        }
        if (profile.getVisibility() == ProfileVisibility.PRIVATE) {
            throw new NotFoundException("Private profile. The user does not make these details visible.");
        }
    }
}
