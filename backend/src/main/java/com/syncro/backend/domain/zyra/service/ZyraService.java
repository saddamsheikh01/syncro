package com.syncro.backend.domain.zyra.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncro.backend.common.exception.BadRequestException;
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
import com.syncro.backend.domain.zyra.dto.ZyraChatResponse;
import com.syncro.backend.domain.zyra.dto.ZyraMessageRequest;
import com.syncro.backend.domain.zyra.dto.ZyraMessageResponse;
import com.syncro.backend.domain.zyra.dto.ZyraPlaceRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSessionResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionRequest;
import com.syncro.backend.domain.zyra.dto.ZyraTestRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraChatRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraProfileRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionResponse;
import com.syncro.backend.domain.zyra.entity.ZyraChatSession;
import com.syncro.backend.domain.zyra.entity.ZyraMessage;
import com.syncro.backend.domain.zyra.entity.ZyraMessageRole;
import com.syncro.backend.domain.zyra.entity.ZyraSuggestion;
import com.syncro.backend.domain.zyra.mapper.ZyraMapper;
import com.syncro.backend.domain.zyra.repository.ZyraChatSessionRepository;
import com.syncro.backend.domain.zyra.repository.ZyraMessageRepository;
import com.syncro.backend.domain.zyra.repository.ZyraSuggestionRepository;
import com.syncro.backend.security.UserPrincipal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ZyraService {

    private static final int MAX_TEST_RECAPS = 6;
    private static final int MAX_QUESTIONS_PER_TEST = 3;
    private static final int MAX_OPTIONS_PER_QUESTION = 2;
    private static final int MAX_QUESTION_TEXT = 80;

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
    private final ZyraClient zyraClient;
    private final ZyraMapper zyraMapper;
    private final ObjectMapper objectMapper;
    private final int maxHistory;
    private final String systemPrompt;

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
        ZyraClient zyraClient,
        ZyraMapper zyraMapper,
        ObjectMapper objectMapper,
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
        this.zyraClient = zyraClient;
        this.zyraMapper = zyraMapper;
        this.objectMapper = objectMapper;
        this.maxHistory = zyraProperties.maxHistory();
        this.systemPrompt = zyraProperties.systemPrompt().trim();
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
            CompletableFuture.runAsync(() -> {
                String generatedTitle = generateSessionTitle(firstMessage);
                if (generatedTitle != null && !generatedTitle.isBlank()) {
                    sessionRepository.findById(sessionIdForAsync).ifPresent(s -> {
                        s.setTitle(generatedTitle);
                        sessionRepository.save(s);
                    });
                }
            });
        }

        List<ZyraChatMessage> promptMessages = buildPromptMessages(user, session.getId());
        String assistantReply = zyraClient.chat(promptMessages);

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
        String reply = zyraClient.chat(messages);

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
    public ZyraProfileRecapResponse getProfileRecap(UserPrincipal principal) {
        User user = getUser(principal);
        return recapCache.getProfileRecap(user.getId())
            .map(entry -> new ZyraProfileRecapResponse(entry.recap(), entry.generatedAt()))
            .orElseGet(() -> {
                String recap = generateProfileRecap(user);
                java.time.Instant generatedAt = java.time.Instant.now();
                recapCache.putProfileRecap(user.getId(), recap, generatedAt);
                return new ZyraProfileRecapResponse(recap, generatedAt);
            });
    }

    @Transactional
    public void refreshProfileRecap(User user) {
        if (user == null || user.getId() == null) {
            return;
        }
        try {
            String recap = generateProfileRecap(user);
            java.time.Instant generatedAt = java.time.Instant.now();
            recapCache.putProfileRecap(user.getId(), recap, generatedAt);
        } catch (Exception ignored) {
            // evita di bloccare il salvataggio profilo se il recap fallisce
        }
    }

    @Transactional(readOnly = true)
    public ZyraProfileRecapResponse getProfileRecapForUser(UserPrincipal principal, UUID userId) {
        getUser(principal);
        if (userId == null) {
            throw new NotFoundException("Utente non valido");
        }
        User target = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        ensureProfilePublic(target.getId());
        return recapCache.getProfileRecap(target.getId())
            .map(entry -> new ZyraProfileRecapResponse(entry.recap(), entry.generatedAt()))
            .orElseGet(() -> {
                String recap = generateProfileRecap(target);
                java.time.Instant generatedAt = java.time.Instant.now();
                recapCache.putProfileRecap(target.getId(), recap, generatedAt);
                return new ZyraProfileRecapResponse(recap, generatedAt);
            });
    }

    @Transactional(readOnly = true)
    public ZyraPlaceRecapResponse getPlaceRecap(UserPrincipal principal, UUID placeId) {
        User user = getUser(principal);
        if (placeId == null) {
            throw new NotFoundException("Luogo non valido");
        }
        Place place = placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
        return recapCache.getPlaceRecap(user.getId(), placeId)
            .map(entry -> new ZyraPlaceRecapResponse(entry.recap(), entry.generatedAt()))
            .orElseGet(() -> {
                String recap = generatePlaceRecap(user, place);
                java.time.Instant generatedAt = java.time.Instant.now();
                recapCache.putPlaceRecap(user.getId(), placeId, recap, generatedAt);
                return new ZyraPlaceRecapResponse(recap, generatedAt);
            });
    }

    private String generateProfileRecap(User user) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        List<String> testSummaries = buildTestSummaries(user);

        StringBuilder prompt = new StringBuilder();
        prompt.append("Genera un breve riepilogo del profilo utente (3-4 frasi, tono amichevole e personale). ");
        prompt.append("Usa in via prioritaria le sezioni guidate del profilo se presenti ");
        prompt.append("(Cosa mi caratterizza, Cosa amo, Cosa non sopporto, Cosa cerco, Valori, ");
        prompt.append("Stato relazionale, Orientamento, Figli). ");
        prompt.append("Se le sezioni guidate sono vuote, usa la bio come fallback. ");
        prompt.append("Scrivi in prima persona come se fosse l'utente a descriversi. ");
        prompt.append("Esempio: 'Sono una persona curiosa che ama viaggiare...'. ");
        prompt.append("Non inventare dettagli mancanti e non usare liste o punti elenco. ");
        if (testSummaries != null && !testSummaries.isEmpty()) {
            prompt.append("Integra naturalmente i risultati dei test completati, ");
            prompt.append("evidenziando i tratti di personalita emersi (es. 'Dai test emerge che sono...'). ");
        } else {
            prompt.append("Se non risultano test completati, non menzionare i test. ");
        }
        prompt.append("Se presente il profilo astrologico, menzionalo brevemente in modo naturale ");
        prompt.append("(es. 'Sono un Ariete ascendente Leone...' o 'Il mio segno zodiacale e...'). ");
        prompt.append("Se presenti i punteggi dei test, usali per descrivere la personalita ");
        prompt.append("(es. punteggio lifestyle alto = persona dinamica, values alto = persona con valori forti). ");
        prompt.append("Dati disponibili:\n");

        if (profile != null) {
            if (profile.getFullName() != null && !profile.getFullName().isBlank()) {
                prompt.append("- Nome: ").append(profile.getFullName()).append("\n");
            }
            if (profile.getCity() != null && !profile.getCity().isBlank()) {
                prompt.append("- Citta: ").append(profile.getCity()).append("\n");
            }
            if (profile.getCountry() != null && !profile.getCountry().isBlank()) {
                prompt.append("- Paese: ").append(profile.getCountry()).append("\n");
            }
            if (profile.getBirthDate() != null) {
                prompt.append("- Eta: ").append(formatAge(profile.getBirthDate())).append(" anni\n");
            }
            appendExtendedProfileInfo(prompt, profile);
            if (!hasExtendedProfile(profile) && profile.getBio() != null && !profile.getBio().isBlank()) {
                prompt.append("- Bio: ").append(profile.getBio()).append("\n");
            }
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                prompt.append("- Lavoro: ").append(jobLabel).append("\n");
            }
        }

        if (!interests.isEmpty()) {
            String interestNames = interests.stream()
                .map(interest -> interest.getTag() != null ? interest.getTag().getName() : null)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!interestNames.isBlank()) {
                prompt.append("- Interessi: ").append(interestNames).append("\n");
            }
        }

        if (psyProfile != null && psyProfile.getProfile() != null && !psyProfile.getProfile().isEmpty()) {
            prompt.append("- Profilo psicologico: ").append(safeJson(psyProfile.getProfile())).append("\n");
        }

        // Aggregated scores from tests
        if (psyProfile != null) {
            StringBuilder scores = new StringBuilder();
            if (psyProfile.getInterestsScore() != null) {
                scores.append("Interessi: ").append(psyProfile.getInterestsScore()).append("%, ");
            }
            if (psyProfile.getLifestyleScore() != null) {
                scores.append("Lifestyle: ").append(psyProfile.getLifestyleScore()).append("%, ");
            }
            if (psyProfile.getValuesScore() != null) {
                scores.append("Valori: ").append(psyProfile.getValuesScore()).append("%, ");
            }
            if (psyProfile.getObjectivesScore() != null) {
                scores.append("Obiettivi: ").append(psyProfile.getObjectivesScore()).append("%, ");
            }
            if (psyProfile.getPsyScore() != null) {
                scores.append("Personalita: ").append(psyProfile.getPsyScore()).append("%, ");
            }
            if (psyProfile.getAstroScore() != null) {
                scores.append("Astrologia: ").append(psyProfile.getAstroScore()).append("%");
            }
            String scoresStr = scores.toString().replaceAll(", $", "");
            if (!scoresStr.isBlank()) {
                prompt.append("- Punteggi test completati: ").append(scoresStr).append("\n");
            }
        }

        // Astro signs from profile
        if (profile != null) {
            StringBuilder astro = new StringBuilder();
            if (profile.getZodiacSign() != null) {
                astro.append("Segno: ").append(formatZodiacSign(profile.getZodiacSign())).append(", ");
            }
            if (profile.getSunSign() != null) {
                astro.append("Sole: ").append(formatZodiacSign(profile.getSunSign())).append(", ");
            }
            if (profile.getMoonSign() != null) {
                astro.append("Luna: ").append(formatZodiacSign(profile.getMoonSign())).append(", ");
            }
            if (profile.getAscSign() != null) {
                astro.append("Ascendente: ").append(formatZodiacSign(profile.getAscSign())).append(", ");
            }
            if (profile.getVenusSign() != null) {
                astro.append("Venere: ").append(formatZodiacSign(profile.getVenusSign())).append(", ");
            }
            if (profile.getMarsSign() != null) {
                astro.append("Marte: ").append(formatZodiacSign(profile.getMarsSign()));
            }
            String astroStr = astro.toString().replaceAll(", $", "");
            if (!astroStr.isBlank()) {
                prompt.append("- Profilo astrologico: ").append(astroStr).append("\n");
            }
            if (profile.getGender() != null) {
                prompt.append("- Genere: ").append(formatGender(profile.getGender())).append("\n");
            }
        }

        if (testSummaries != null && !testSummaries.isEmpty()) {
            prompt.append("- Test completati (riassunto per test):\n");
            testSummaries.forEach(summary -> prompt.append("  - ").append(summary).append("\n"));
        }

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", "Sei Zyra, un assistente AI di Syncro. Genera riepiloghi profilo brevi e coinvolgenti."),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String recap = zyraClient.chat(messages);
            return recap != null ? recap.trim() : "Completa il tuo profilo per un riepilogo personalizzato.";
        } catch (Exception ex) {
            return "Completa il tuo profilo per un riepilogo personalizzato.";
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
        String profileLabel = readProfileLabel(submission.getScorePayload());
        String answersSummary = buildAnswersSummary(answers);

        StringBuilder summary = new StringBuilder();
        summary.append(title != null ? title : "Test");
        if (profileLabel != null) {
            summary.append(": profilo ").append(profileLabel);
        }
        if (answersSummary != null) {
            summary.append(profileLabel != null ? ". " : ": ");
            summary.append("Risposte chiave: ").append(answersSummary);
        }
        return summary.toString();
    }

    private String readProfileLabel(Map<String, Object> scorePayload) {
        if (scorePayload == null) {
            return null;
        }
        Object profileObj = scorePayload.get("profile");
        if (!(profileObj instanceof Map<?, ?> profileMap)) {
            return null;
        }
        String name = readText(profileMap, "name");
        if (name != null) {
            return name;
        }
        String label = readText(profileMap, "label");
        if (label != null) {
            return label;
        }
        String code = readText(profileMap, "code");
        return code;
    }

    private String readText(Map<?, ?> map, String key) {
        if (map == null || key == null) {
            return null;
        }
        Object value = map.get(key);
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isBlank() ? null : text;
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
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        List<String> placeTags = loadPlaceTags(place.getId());

        StringBuilder prompt = new StringBuilder();
        prompt.append("Genera un breve riepilogo (2-3 frasi) che spiega quanto questo luogo e adatto all'utente. ");
        prompt.append("Confronta interessi, stile di vita e personalita dell'utente con le caratteristiche del luogo. ");
        prompt.append("Usa i punteggi di personalita per valutare l'affinita: ");
        prompt.append("lifestyle alto = persona dinamica/sociale, values alto = attenta ai valori/etica, ");
        prompt.append("psy alto = persona riflessiva/introspettiva. ");
        prompt.append("Se mancano dati, rimani generico e non inventare. ");
        prompt.append("Tono amichevole e diretto. Nessuna lista.\n");
        prompt.append("Dati utente:\n");

        if (profile != null) {
            if (profile.getFullName() != null && !profile.getFullName().isBlank()) {
                prompt.append("- Nome: ").append(profile.getFullName()).append("\n");
            }
            if (profile.getCity() != null && !profile.getCity().isBlank()) {
                prompt.append("- Citta: ").append(profile.getCity()).append("\n");
            }
            if (profile.getCountry() != null && !profile.getCountry().isBlank()) {
                prompt.append("- Paese: ").append(profile.getCountry()).append("\n");
            }
            if (profile.getBirthDate() != null) {
                prompt.append("- Eta: ").append(formatAge(profile.getBirthDate())).append(" anni\n");
            }
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                prompt.append("- Lavoro: ").append(jobLabel).append("\n");
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
                prompt.append("- Interessi: ").append(interestNames).append("\n");
            }
        }

        // Aggregated scores from tests
        if (psyProfile != null) {
            StringBuilder scores = new StringBuilder();
            if (psyProfile.getLifestyleScore() != null) {
                scores.append("Lifestyle: ").append(psyProfile.getLifestyleScore()).append("%, ");
            }
            if (psyProfile.getValuesScore() != null) {
                scores.append("Valori: ").append(psyProfile.getValuesScore()).append("%, ");
            }
            if (psyProfile.getPsyScore() != null) {
                scores.append("Personalita: ").append(psyProfile.getPsyScore()).append("%");
            }
            String scoresStr = scores.toString().replaceAll(", $", "");
            if (!scoresStr.isBlank()) {
                prompt.append("- Profilo personalita: ").append(scoresStr).append("\n");
            }
        }

        // Gender for context
        if (profile != null && profile.getGender() != null) {
            prompt.append("- Genere: ").append(formatGender(profile.getGender())).append("\n");
        }

        prompt.append("Dati luogo:\n");
        prompt.append("- Nome: ").append(place.getName()).append("\n");
        if (place.getCategory() != null && place.getCategory().getName() != null) {
            prompt.append("- Categoria: ").append(place.getCategory().getName()).append("\n");
        }
        if (place.getDescription() != null && !place.getDescription().isBlank()) {
            prompt.append("- Descrizione: ").append(place.getDescription()).append("\n");
        }
        if (place.getCity() != null && !place.getCity().isBlank()) {
            prompt.append("- Citta: ").append(place.getCity()).append("\n");
        }
        if (place.getAddress() != null && !place.getAddress().isBlank()) {
            prompt.append("- Indirizzo: ").append(place.getAddress()).append("\n");
        }
        if (!placeTags.isEmpty()) {
            prompt.append("- Tag: ").append(String.join(", ", placeTags)).append("\n");
        }
        if (place.getGoogleTypes() != null && !place.getGoogleTypes().isEmpty()) {
            String types = place.getGoogleTypes().stream()
                .filter(type -> type != null && !type.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!types.isBlank()) {
                prompt.append("- Tipi Google: ").append(types).append("\n");
            }
        }
        if (place.getGoogleRating() != null) {
            prompt.append("- Rating Google: ").append(place.getGoogleRating()).append("\n");
        }
        if (place.getGoogleReviewCount() != null && place.getGoogleReviewCount() > 0) {
            prompt.append("- Recensioni: ").append(place.getGoogleReviewCount()).append("\n");
        }
        if (place.getPriceLevel() != null) {
            prompt.append("- Prezzo: ").append(formatPriceLevel(place.getPriceLevel())).append("\n");
        }
        Boolean openNow = extractOpenNow(place.getOpeningHours());
        if (openNow != null) {
            prompt.append("- Stato attuale: ").append(openNow ? "Aperto ora" : "Chiuso ora").append("\n");
        }

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", "Sei Zyra, un assistente AI di Syncro. Genera riepiloghi brevi e utili."),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String recap = zyraClient.chat(messages);
            return recap != null ? recap.trim() : "Luogo interessante: aggiorna il profilo per un match piu preciso.";
        } catch (Exception ex) {
            return "Luogo interessante: aggiorna il profilo per un match piu preciso.";
        }
    }

    @Transactional(readOnly = true)
    public ZyraChatRecapResponse getChatRecap(UserPrincipal principal) {
        User user = getUser(principal);
        return recapCache.getChatRecap(user.getId())
            .orElseGet(() -> buildChatRecap(user));
    }

    @Transactional(readOnly = true)
    public ZyraTestRecapResponse getTestRecap(UserPrincipal principal, UUID submissionId) {
        User user = getUser(principal);
        if (submissionId == null) {
            throw new BadRequestException("ID submission non valido");
        }
        UserTestSubmission submission = userTestSubmissionRepository.findById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission non trovata"));
        if (!submission.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Non autorizzato a visualizzare questo test");
        }
        String recap = generateTestRecap(submission);
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
            recap,
            java.time.Instant.now()
        );
    }

    private String generateTestRecap(UserTestSubmission submission) {
        if (submission == null || submission.getTestDefinition() == null) {
            return "Test completato. Completa altri test per un profilo piu completo.";
        }
        List<UserTestAnswer> answers = userTestAnswerRepository.findBySubmission_Id(submission.getId());
        String testTitle = normalizeOptional(submission.getTestDefinition().getTitle());
        String testDescription = normalizeOptional(submission.getTestDefinition().getDescription());
        String testType = submission.getTestDefinition().getTestType().name();

        StringBuilder prompt = new StringBuilder();
        prompt.append("Sei Zyra, l'assistente AI di Syncro. L'utente ha appena completato un test. ");
        prompt.append("Genera un riepilogo personalizzato e coinvolgente (3-5 frasi) che:\n");
        prompt.append("1. Riassuma in modo discorsivo le scelte fatte dall'utente\n");
        prompt.append("2. Azzardi un breve profilo della persona basandoti sulle risposte\n");
        prompt.append("3. Sia scritto in seconda persona, rivolgendoti direttamente all'utente\n");
        prompt.append("4. Abbia un tono amichevole, positivo e incoraggiante\n");
        prompt.append("5. Non elenchi le domande una per una, ma sintetizzi il tutto in modo naturale\n\n");
        prompt.append("NON usare liste puntate o numerate. Scrivi in modo discorsivo e fluido.\n");
        prompt.append("NON ripetere le domande letteralmente, ma interpreta il significato delle risposte.\n\n");

        prompt.append("Informazioni sul test:\n");
        prompt.append("- Titolo: ").append(testTitle != null ? testTitle : "Test").append("\n");
        if (testDescription != null) {
            prompt.append("- Descrizione: ").append(testDescription).append("\n");
        }
        prompt.append("- Tipo: ").append(formatTestType(testType)).append("\n\n");

        if (answers.isEmpty()) {
            prompt.append("L'utente ha completato il test ma non ci sono risposte registrate.\n");
        } else {
            prompt.append("Risposte dell'utente:\n");
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
            new ZyraChatMessage("system", "Sei Zyra, un'assistente AI empatica e perspicace. "
                + "Genera riepiloghi dei test che siano personali, coinvolgenti e che facciano sentire "
                + "l'utente compreso. Evita frasi generiche."),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String recap = zyraClient.chat(messages);
            return recap != null ? recap.trim() : "Ottimo lavoro! Hai completato il test con successo.";
        } catch (Exception ex) {
            return "Ottimo lavoro! Hai completato il test con successo.";
        }
    }

    private String formatTestType(String testType) {
        if (testType == null) return "Generale";
        return switch (testType) {
            case "INTERESTS" -> "Interessi e passioni";
            case "LIFESTYLE" -> "Stile di vita";
            case "VALUES" -> "Valori personali";
            case "OBJECTIVES" -> "Obiettivi di vita";
            case "PSY" -> "Profilo psicologico";
            case "ASTRO" -> "Astrologia";
            default -> "Generale";
        };
    }

    private ZyraChatRecapResponse buildChatRecap(User user) {
        // Get user's recent conversations (last 5)
        PageRequest pageable = PageRequest.of(0, 5, Sort.by(Sort.Order.desc("createdAt")));
        List<ChatParticipant> participants = chatParticipantRepository.findByUserId(user.getId(), pageable).getContent();

        if (participants.isEmpty()) {
            ZyraChatRecapResponse response = new ZyraChatRecapResponse(
                "Non hai ancora conversazioni. Inizia a chattare con qualcuno per vedere un riepilogo qui!",
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

            String otherName = "Utente";
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
                conversationData.append("Conversazione con ").append(otherName).append(":\n");
                List<ChatMessage> orderedMessages = new ArrayList<>(messages);
                Collections.reverse(orderedMessages);
                for (ChatMessage msg : orderedMessages) {
                    String sender = msg.getUser().getId().equals(user.getId()) ? "Tu" : otherName;
                    String content = msg.getContent().length() > 100
                        ? msg.getContent().substring(0, 100) + "..."
                        : msg.getContent();
                    conversationData.append("- ").append(sender).append(": ").append(content).append("\n");
                }
                conversationData.append("\n");
            }
        }

        String recap = generateChatRecap(conversationData.toString(), conversationIds.size());

        ZyraChatRecapResponse response = new ZyraChatRecapResponse(
            recap,
            conversationIds.size(),
            recentContacts,
            java.time.Instant.now()
        );
        recapCache.putChatRecap(user.getId(), response);
        return response;
    }

    private String generateChatRecap(String conversationData, int conversationCount) {
        if (conversationData.isBlank()) {
            return "Le tue conversazioni sono ancora vuote. Inizia a scambiare messaggi!";
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("Genera un breve riepilogo delle conversazioni recenti dell'utente (2-3 frasi, tono amichevole). ");
        prompt.append("Menziona con chi ha parlato e gli argomenti principali discussi. ");
        prompt.append("Scrivi in seconda persona rivolgendoti all'utente. ");
        prompt.append("Esempio: 'Hai chiacchierato con Marco di viaggi e con Sara di musica...'. ");
        prompt.append("Ecco le conversazioni recenti:\n\n");
        prompt.append(conversationData);

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", "Sei Zyra, un assistente AI di Syncro. Genera riepiloghi delle chat brevi e coinvolgenti."),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String recap = zyraClient.chat(messages);
            return recap != null ? recap.trim() : "Hai " + conversationCount + " conversazioni attive.";
        } catch (Exception ex) {
            return "Hai " + conversationCount + " conversazioni attive.";
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
        StringBuilder builder = new StringBuilder(systemPrompt);
        builder.append("\nContesto utente:\n");
        builder.append("- lingua: ").append(safeValue(user.getLanguage())).append("\n");

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null) {
            builder.append("- nome: ").append(safeValue(profile.getFullName())).append("\n");
            builder.append("- citta: ").append(safeValue(profile.getCity())).append("\n");
            builder.append("- paese: ").append(safeValue(profile.getCountry())).append("\n");
            builder.append("- eta: ").append(formatAge(profile.getBirthDate())).append("\n");
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                builder.append("- lavoro: ").append(jobLabel).append("\n");
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
                builder.append("- interessi: ").append(interestNames).append("\n");
            }
        }

        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        if (psyProfile != null && psyProfile.getProfile() != null && !psyProfile.getProfile().isEmpty()) {
            builder.append("- profilo_psicologico: ")
                .append(safeJson(psyProfile.getProfile()))
                .append("\n");
        }

        // Aggregated scores
        if (psyProfile != null) {
            StringBuilder scores = new StringBuilder();
            if (psyProfile.getInterestsScore() != null) {
                scores.append("interessi:").append(psyProfile.getInterestsScore()).append("% ");
            }
            if (psyProfile.getLifestyleScore() != null) {
                scores.append("lifestyle:").append(psyProfile.getLifestyleScore()).append("% ");
            }
            if (psyProfile.getValuesScore() != null) {
                scores.append("valori:").append(psyProfile.getValuesScore()).append("% ");
            }
            if (psyProfile.getObjectivesScore() != null) {
                scores.append("obiettivi:").append(psyProfile.getObjectivesScore()).append("% ");
            }
            if (psyProfile.getPsyScore() != null) {
                scores.append("psy:").append(psyProfile.getPsyScore()).append("% ");
            }
            if (psyProfile.getAstroScore() != null) {
                scores.append("astro:").append(psyProfile.getAstroScore()).append("%");
            }
            String scoresStr = scores.toString().trim();
            if (!scoresStr.isBlank()) {
                builder.append("- punteggi_test: ").append(scoresStr).append("\n");
            }
        }

        // Astro signs
        if (profile != null) {
            StringBuilder astro = new StringBuilder();
            if (profile.getZodiacSign() != null) {
                astro.append(formatZodiacSign(profile.getZodiacSign())).append(" ");
            }
            if (profile.getAscSign() != null) {
                astro.append("asc:").append(formatZodiacSign(profile.getAscSign())).append(" ");
            }
            if (profile.getMoonSign() != null) {
                astro.append("luna:").append(formatZodiacSign(profile.getMoonSign()));
            }
            String astroStr = astro.toString().trim();
            if (!astroStr.isBlank()) {
                builder.append("- segni: ").append(astroStr).append("\n");
            }
            if (profile.getGender() != null) {
                builder.append("- genere: ").append(formatGender(profile.getGender())).append("\n");
            }
        }

        return builder.toString();
    }

    private String buildSuggestionPrompt(ZyraSuggestionRequest request, String context) {
        StringBuilder builder = new StringBuilder();
        builder.append("Genera un suggerimento personalizzato per l'utente. Tipo: ")
            .append(request.suggestionType().name())
            .append(".");
        if (context != null) {
            builder.append(" Contesto aggiuntivo: ").append(context);
        }
        return builder.toString();
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
            throw new BadRequestException("Contenuto non valido");
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Contenuto non valido");
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
            case 0 -> "Gratis";
            case 1 -> "Economico";
            case 2 -> "Medio";
            case 3 -> "Costoso";
            case 4 -> "Molto costoso";
            default -> "Non disponibile";
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
            builder.append("- Cosa mi caratterizza: ").append(profile.getTraitsText()).append("\n");
        }
        if (isNotBlank(profile.getLovesText())) {
            builder.append("- Cosa amo: ").append(profile.getLovesText()).append("\n");
        }
        if (isNotBlank(profile.getDislikesText())) {
            builder.append("- Cosa non sopporto: ").append(profile.getDislikesText()).append("\n");
        }
        if (isNotBlank(profile.getGoalsText())) {
            builder.append("- Cosa cerco: ").append(profile.getGoalsText()).append("\n");
        }
        if (isNotBlank(profile.getValuesText())) {
            builder.append("- Valori: ").append(profile.getValuesText()).append("\n");
        }
        if (profile.getRelationshipStatus() != null) {
            builder.append("- Stato relazionale: ")
                .append(formatRelationshipStatus(profile.getRelationshipStatus()))
                .append("\n");
        }
        if (profile.getOrientation() != null) {
            builder.append("- Orientamento: ")
                .append(formatOrientation(profile.getOrientation()))
                .append("\n");
        }
        if (profile.getChildrenStatus() != null) {
            builder.append("- Figli: ")
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
            case IN_RELATIONSHIP -> "In relazione";
            case MARRIED -> "Sposato/a";
            case SEPARATED -> "Separato/a";
            case COMPLICATED -> "Situazione complicata";
            case OTHER -> "Altro";
        };
    }

    private String formatOrientation(Orientation orientation) {
        if (orientation == null) {
            return "";
        }
        return switch (orientation) {
            case HETERO -> "Etero";
            case GAY -> "Gay";
            case BI -> "Bisessuale";
            case ASEXUAL -> "Asessuale";
            case OTHER -> "Altro";
        };
    }

    private String formatChildrenStatus(ChildrenStatus status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case NO_CHILDREN -> "Nessun figlio";
            case HAS_CHILDREN -> "Ha figli";
            case WANTS_CHILDREN -> "Vuole figli";
            case DOES_NOT_WANT -> "Non vuole figli";
            case UNDECIDED -> "Indeciso/a";
        };
    }

    private String formatZodiacSign(com.syncro.backend.domain.profile.entity.ZodiacSign sign) {
        if (sign == null) {
            return "";
        }
        return switch (sign) {
            case ARIES -> "Ariete";
            case TAURUS -> "Toro";
            case GEMINI -> "Gemelli";
            case CANCER -> "Cancro";
            case LEO -> "Leone";
            case VIRGO -> "Vergine";
            case LIBRA -> "Bilancia";
            case SCORPIO -> "Scorpione";
            case SAGITTARIUS -> "Sagittario";
            case CAPRICORN -> "Capricorno";
            case AQUARIUS -> "Acquario";
            case PISCES -> "Pesci";
            case UNKNOWN -> "Non specificato";
        };
    }

    private String formatGender(com.syncro.backend.domain.profile.entity.Gender gender) {
        if (gender == null) {
            return "";
        }
        return switch (gender) {
            case MALE -> "Uomo";
            case FEMALE -> "Donna";
            case NON_BINARY -> "Non binario";
            case OTHER -> "Altro";
            case PREFER_NOT_TO_SAY -> "Preferisce non dirlo";
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

    private String generateSessionTitle(String firstUserMessage) {
        String prompt = "Genera un titolo breve (max 48 caratteri) per questa chat, "
            + "basato sul primo messaggio utente. "
            + "Rispondi solo con il titolo, senza virgolette.";
        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", prompt),
            new ZyraChatMessage("user", firstUserMessage)
        );
        try {
            String title = zyraClient.chat(messages);
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
            return "Chat con Zyra";
        }
        String trimmed = content.trim();
        return trimmed.length() > 48 ? trimmed.substring(0, 48) + "..." : trimmed;
    }

    private ZyraChatSession getSession(UUID userId, UUID sessionId) {
        if (sessionId == null) {
            throw new BadRequestException("Sessione non valida");
        }
        return sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new NotFoundException("Sessione non trovata"));
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private void ensureProfilePublic(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            throw new NotFoundException("Profilo non disponibile");
        }
        if (profile.getVisibility() == ProfileVisibility.PRIVATE) {
            throw new NotFoundException("Profilo privato. L'utente non rende visibili i dettagli.");
        }
    }
}
