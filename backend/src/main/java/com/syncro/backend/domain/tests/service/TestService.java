package com.syncro.backend.domain.tests.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.tests.dto.TestAnswerRequest;
import com.syncro.backend.domain.tests.dto.TestAnswerOptionResponse;
import com.syncro.backend.domain.tests.dto.TestCountResponse;
import com.syncro.backend.domain.tests.dto.TestDetailResponse;
import com.syncro.backend.domain.tests.dto.TestListResponse;
import com.syncro.backend.domain.tests.dto.TestQuestionResponse;
import com.syncro.backend.domain.tests.dto.TestSubmissionRequest;
import com.syncro.backend.domain.tests.dto.TestSubmissionResponse;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestAnswerOptionTranslation;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestDefinitionTranslation;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import com.syncro.backend.domain.tests.entity.TestQuestionTranslation;
import com.syncro.backend.domain.tests.entity.TestQuestionType;
import com.syncro.backend.domain.tests.entity.TestScoringStrategy;
import com.syncro.backend.domain.tests.entity.TestType;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import com.syncro.backend.domain.tests.mapper.TestMapper;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionRepository;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionTranslationRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionTranslationRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionTranslationRepository;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.zyra.cache.ZyraRecapCache;
import com.syncro.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestService {

    private static final Set<String> SUPPORTED_LOCALES = Set.of("en", "it", "es", "fr", "sq", "pt");

    private final TestDefinitionRepository testDefinitionRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerOptionRepository testAnswerOptionRepository;
    private final TestDefinitionTranslationRepository testDefinitionTranslationRepository;
    private final TestQuestionTranslationRepository testQuestionTranslationRepository;
    private final TestAnswerOptionTranslationRepository testAnswerOptionTranslationRepository;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final UserPsyProfileRepository userPsyProfileRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ZyraRecapCache recapCache;
    private final TestMapper testMapper;

    public TestService(
        TestDefinitionRepository testDefinitionRepository,
        TestQuestionRepository testQuestionRepository,
        TestAnswerOptionRepository testAnswerOptionRepository,
        TestDefinitionTranslationRepository testDefinitionTranslationRepository,
        TestQuestionTranslationRepository testQuestionTranslationRepository,
        TestAnswerOptionTranslationRepository testAnswerOptionTranslationRepository,
        UserTestSubmissionRepository userTestSubmissionRepository,
        UserTestAnswerRepository userTestAnswerRepository,
        UserPsyProfileRepository userPsyProfileRepository,
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        ZyraRecapCache recapCache,
        TestMapper testMapper
    ) {
        this.testDefinitionRepository = testDefinitionRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAnswerOptionRepository = testAnswerOptionRepository;
        this.testDefinitionTranslationRepository = testDefinitionTranslationRepository;
        this.testQuestionTranslationRepository = testQuestionTranslationRepository;
        this.testAnswerOptionTranslationRepository = testAnswerOptionTranslationRepository;
        this.userTestSubmissionRepository = userTestSubmissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.userPsyProfileRepository = userPsyProfileRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.recapCache = recapCache;
        this.testMapper = testMapper;
    }

    @Transactional(readOnly = true)
    public TestListResponse getTests(UserPrincipal principal) {
        User user = getUser(principal);
        String locale = resolveLocale(user.getLanguage());
        List<TestDefinition> tests = testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc();
        List<UUID> completedIds = userTestSubmissionRepository
            .findDistinctTestDefinitionIdsByUserId(user.getId());
        java.util.Set<UUID> completedSet = new java.util.HashSet<>(completedIds);
        Map<UUID, TestDefinitionTranslation> definitionTranslations = loadDefinitionTranslations(
            tests.stream().map(TestDefinition::getId).toList(),
            locale
        );
        return new TestListResponse(
            tests.stream()
                .map(definition -> {
                    TestDefinitionTranslation translation = definitionTranslations.get(definition.getId());
                    String title = resolveDefinitionTitle(definition, translation);
                    String description = resolveDefinitionDescription(definition, translation);
                    return testMapper.toSummaryResponse(
                        definition,
                        completedSet.contains(definition.getId()),
                        title,
                        description
                    );
                })
                .toList()
        );
    }

    @Transactional(readOnly = true)
    public TestDetailResponse getTest(UserPrincipal principal, UUID testId) {
        User user = getUser(principal);
        String locale = resolveLocale(user.getLanguage());
        TestDefinition definition = testDefinitionRepository.findByIdAndActiveTrue(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));
        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        boolean completed = userTestSubmissionRepository
            .existsByUser_IdAndTestDefinition_Id(user.getId(), testId);

        Set<UUID> selectedOptionIds;
        if (completed) {
            Optional<UserTestSubmission> submissionOpt = userTestSubmissionRepository
                .findByUser_IdAndTestDefinition_Id(user.getId(), testId);
            if (submissionOpt.isPresent()) {
                List<UserTestAnswer> userAnswers = userTestAnswerRepository
                    .findBySubmission_Id(submissionOpt.get().getId());
                selectedOptionIds = userAnswers.stream()
                    .map(a -> a.getAnswerOption().getId())
                    .collect(Collectors.toSet());
            } else {
                selectedOptionIds = Set.of();
            }
        } else {
            selectedOptionIds = Set.of();
        }

        Map<UUID, TestDefinitionTranslation> definitionTranslations = loadDefinitionTranslations(
            List.of(definition.getId()),
            locale
        );
        Map<UUID, TestQuestionTranslation> questionTranslations = loadQuestionTranslations(
            questions.stream().map(TestQuestion::getId).toList(),
            locale
        );
        List<UUID> optionIds = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .map(TestAnswerOption::getId)
            .toList();
        Map<UUID, TestAnswerOptionTranslation> optionTranslations = loadOptionTranslations(optionIds, locale);

        List<TestQuestionResponse> questionResponses = questions.stream()
            .map(question -> new TestQuestionResponse(
                question.getId(),
                resolveQuestionText(question, questionTranslations.get(question.getId())),
                question.getPosition(),
                question.getQuestionType(),
                question.isRequired(),
                question.getMaxSelections(),
                optionsByQuestion.getOrDefault(question.getId(), List.of()).stream()
                    .map(option -> new TestAnswerOptionResponse(
                        option.getId(),
                        resolveOptionLabel(option, optionTranslations.get(option.getId())),
                        option.getMetadata(),
                        selectedOptionIds.contains(option.getId())
                    ))
                    .toList()
            ))
            .toList();

        TestDefinitionTranslation definitionTranslation = definitionTranslations.get(definition.getId());
        return new TestDetailResponse(
            definition.getId(),
            resolveDefinitionTitle(definition, definitionTranslation),
            resolveDefinitionDescription(definition, definitionTranslation),
            definition.getTestType(),
            completed,
            definition.getScoringStrategy(),
            definition.getConfig(),
            questionResponses
        );
    }

    @Transactional(readOnly = true)
    public TestCountResponse getMyCompletedTestsCount(UserPrincipal principal) {
        User user = getUser(principal);
        long count = userTestSubmissionRepository.countDistinctTestDefinitionIdByUserId(user.getId());
        if (hasCompletedBirthChart(user.getId())) {
            count += 1;
        }
        return new TestCountResponse(count);
    }

    @Transactional(readOnly = true)
    public TestCountResponse getUserCompletedTestsCount(UserPrincipal principal, UUID userId) {
        User requester = getUser(principal);
        if (userId == null) {
            throw new NotFoundException("Utente non valido");
        }
        if (!userId.equals(requester.getId())) {
            UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profilo non disponibile"));
            if (profile.getVisibility() == ProfileVisibility.PRIVATE) {
                throw new NotFoundException("Profilo privato. L'utente non rende visibili i dettagli.");
            }
        }
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("Utente non trovato"));
        long count = userTestSubmissionRepository.countDistinctTestDefinitionIdByUserId(userId);
        if (hasCompletedBirthChart(userId)) {
            count += 1;
        }
        return new TestCountResponse(count);
    }

    /**
     * Birth chart is considered completed when the user has saved a chart via Profile/Insights
     * (date + place and optional time, with calculation saved to profile).
     */
    private boolean hasCompletedBirthChart(UUID userId) {
        return userProfileRepository.findByUserId(userId)
            .filter(p -> p.getBirthDate() != null && (
                (p.getZyraBirthChartInterpretation() != null && !p.getZyraBirthChartInterpretation().isBlank())
                || p.getSunSign() != null
            ))
            .isPresent();
    }

    @Transactional
    public TestSubmissionResponse submitTest(UserPrincipal principal, UUID testId, TestSubmissionRequest request) {
        User user = getUser(principal);
        TestDefinition definition = testDefinitionRepository.findByIdAndActiveTrue(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));
        Optional<UserTestSubmission> existingSubmission = userTestSubmissionRepository
            .findByUser_IdAndTestDefinition_Id(user.getId(), testId);

        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Test senza domande");
        }
        if (request.answers() == null || request.answers().isEmpty()) {
            throw new BadRequestException("Risposte mancanti");
        }

        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        Map<UUID, TestAnswerOption> optionsById = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .collect(Collectors.toMap(TestAnswerOption::getId, Function.identity()));
        Map<UUID, TestQuestion> questionsById = questions.stream()
            .collect(Collectors.toMap(TestQuestion::getId, Function.identity()));

        Map<UUID, List<UUID>> answersByQuestion = normalizeAnswers(request.answers(), questionsById);
        validateAnswers(definition, questions, optionsByQuestion, optionsById, answersByQuestion);

        int answeredQuestions = (int) answersByQuestion.entrySet().stream()
            .filter(entry -> !entry.getValue().isEmpty())
            .count();
        int totalQuestions = questions.size();
        if (answeredQuestions == 0) {
            throw new BadRequestException("Risposte mancanti");
        }
        int confidence = totalQuestions == 0
            ? 0
            : (int) Math.round(100.0 * answeredQuestions / totalQuestions);

        Map<String, Object> scorePayload = buildScorePayload(
            definition,
            questions,
            optionsByQuestion,
            optionsById,
            answersByQuestion
        );

        UserTestSubmission submission;
        if (existingSubmission.isPresent()) {
            submission = existingSubmission.get();
            userTestAnswerRepository.deleteBySubmissionId(submission.getId());
            submission.setScorePayload(scorePayload);
            submission.setSubmittedAt(Instant.now());
        } else {
            submission = new UserTestSubmission();
            submission.setUser(user);
            submission.setTestDefinition(definition);
            submission.setScorePayload(scorePayload);
        }
        UserTestSubmission savedSubmission = userTestSubmissionRepository.save(submission);

        List<UserTestAnswer> answers = new ArrayList<>();
        answersByQuestion.forEach((questionId, optionIds) -> {
            if (optionIds == null || optionIds.isEmpty()) {
                return;
            }
            TestQuestion question = questionsById.get(questionId);
            optionIds.forEach(optionId -> {
                UserTestAnswer entity = new UserTestAnswer();
                entity.setSubmission(savedSubmission);
                entity.setQuestion(question);
                entity.setAnswerOption(optionsById.get(optionId));
                answers.add(entity);
            });
        });
        userTestAnswerRepository.saveAll(answers);

        // Aggiorna i campi astrologici nel UserProfile se il test è di tipo ASTRO
        if (definition.getTestType() == TestType.ASTRO) {
            updateAstroSignsInProfile(user, answersByQuestion, optionsById);
        }

        UserPsyProfile profile = userPsyProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserPsyProfile created = new UserPsyProfile();
                created.setUser(user);
                return created;
            });
        if (profile.getUser() == null || profile.getUserId() == null) {
            profile.setUser(user);
        }
        Map<String, Object> profileData = profile.getProfile();
        if (profileData == null) {
            profileData = new HashMap<>();
        }
        Map<String, Object> testsData = getOrCreateTestsMap(profileData);
        Map<String, Object> testEntry = new HashMap<>();
        testEntry.put("strategy", definition.getScoringStrategy().name());
        testEntry.put("testType", definition.getTestType().name());
        testEntry.put("payload", scorePayload);
        if (definition.getScoringStrategy() == TestScoringStrategy.SINGLE_SCORE) {
            Object normalizedScore = scorePayload.get("normalizedScore");
            if (normalizedScore != null) {
                testEntry.put("score", normalizedScore);
            }
            if (scorePayload.get("rawScore") != null) {
                testEntry.put("rawScore", scorePayload.get("rawScore"));
            }
            if (scorePayload.get("maxScore") != null) {
                testEntry.put("maxScore", scorePayload.get("maxScore"));
            }
        }
        testEntry.put("submissionId", savedSubmission.getId().toString());
        testEntry.put("submittedAt", savedSubmission.getSubmittedAt().toString());
        testsData.put(definition.getId().toString(), testEntry);
        profileData.put("tests", testsData);
        updateProfileDimensions(profileData, definition, scorePayload, confidence);
        profile.setProfile(profileData);
        updateAggregatedScore(profile, definition, scorePayload);
        userPsyProfileRepository.save(profile);
        recapCache.invalidateUser(user.getId());
        return new TestSubmissionResponse(
            savedSubmission.getId(),
            definition.getId(),
            savedSubmission.getSubmittedAt()
        );
    }

    @Transactional
    public void resetMySubmissions(UserPrincipal principal) {
        User user = getUser(principal);
        List<UserTestSubmission> submissions = userTestSubmissionRepository.findByUser_Id(user.getId());
        if (!submissions.isEmpty()) {
            List<UUID> submissionIds = submissions.stream()
                .map(UserTestSubmission::getId)
                .toList();
            List<UserTestAnswer> answers = userTestAnswerRepository.findBySubmission_IdIn(submissionIds);
            userTestAnswerRepository.deleteAll(answers);
            userTestSubmissionRepository.deleteAll(submissions);
        }
        clearBirthChartFromProfile(user.getId());
        recapCache.invalidateUser(user.getId());
    }

    @Transactional
    public void resetMySubmissionForTest(UserPrincipal principal, UUID testId) {
        User user = getUser(principal);
        TestDefinition definition = testDefinitionRepository.findByIdAndActiveTrue(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));
        UserTestSubmission submission = userTestSubmissionRepository
            .findByUser_IdAndTestDefinition_Id(user.getId(), testId)
            .orElse(null);
        if (submission == null) {
            return;
        }
        List<UserTestAnswer> answers = userTestAnswerRepository.findBySubmission_Id(submission.getId());
        if (!answers.isEmpty()) {
            userTestAnswerRepository.deleteAll(answers);
        }
        userTestSubmissionRepository.delete(submission);
        removeTestFromProfile(user, testId, definition.getTestType());
        recapCache.invalidateUser(user.getId());
    }

    private String resolveLocale(String language) {
        if (language == null || language.isBlank()) {
            return "en";
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        int separatorIndex = normalized.indexOf('-');
        if (separatorIndex > 0) {
            normalized = normalized.substring(0, separatorIndex);
        }
        return SUPPORTED_LOCALES.contains(normalized) ? normalized : "en";
    }

    private List<String> buildLocalePriority(String locale) {
        return "en".equals(locale) ? List.of("en") : List.of(locale, "en");
    }

    private Map<UUID, TestDefinitionTranslation> loadDefinitionTranslations(
        List<UUID> testIds,
        String locale
    ) {
        if (testIds == null || testIds.isEmpty()) {
            return Map.of();
        }
        List<TestDefinitionTranslation> translations = testDefinitionTranslationRepository
            .findByTestDefinition_IdInAndLocaleIn(testIds, buildLocalePriority(locale));
        Map<UUID, TestDefinitionTranslation> selected = new HashMap<>();
        for (TestDefinitionTranslation translation : translations) {
            if (translation == null || translation.getTestDefinition() == null) {
                continue;
            }
            UUID testId = translation.getTestDefinition().getId();
            if (testId == null) {
                continue;
            }
            TestDefinitionTranslation current = selected.get(testId);
            if (current == null || isBetterLocaleMatch(translation.getLocale(), current.getLocale(), locale)) {
                selected.put(testId, translation);
            }
        }
        return selected;
    }

    private Map<UUID, TestQuestionTranslation> loadQuestionTranslations(
        List<UUID> questionIds,
        String locale
    ) {
        if (questionIds == null || questionIds.isEmpty()) {
            return Map.of();
        }
        List<TestQuestionTranslation> translations = testQuestionTranslationRepository
            .findByQuestion_IdInAndLocaleIn(questionIds, buildLocalePriority(locale));
        Map<UUID, TestQuestionTranslation> selected = new HashMap<>();
        for (TestQuestionTranslation translation : translations) {
            if (translation == null || translation.getQuestion() == null) {
                continue;
            }
            UUID questionId = translation.getQuestion().getId();
            if (questionId == null) {
                continue;
            }
            TestQuestionTranslation current = selected.get(questionId);
            if (current == null || isBetterLocaleMatch(translation.getLocale(), current.getLocale(), locale)) {
                selected.put(questionId, translation);
            }
        }
        return selected;
    }

    private Map<UUID, TestAnswerOptionTranslation> loadOptionTranslations(
        List<UUID> optionIds,
        String locale
    ) {
        if (optionIds == null || optionIds.isEmpty()) {
            return Map.of();
        }
        List<TestAnswerOptionTranslation> translations = testAnswerOptionTranslationRepository
            .findByOption_IdInAndLocaleIn(optionIds, buildLocalePriority(locale));
        Map<UUID, TestAnswerOptionTranslation> selected = new HashMap<>();
        for (TestAnswerOptionTranslation translation : translations) {
            if (translation == null || translation.getOption() == null) {
                continue;
            }
            UUID optionId = translation.getOption().getId();
            if (optionId == null) {
                continue;
            }
            TestAnswerOptionTranslation current = selected.get(optionId);
            if (current == null || isBetterLocaleMatch(translation.getLocale(), current.getLocale(), locale)) {
                selected.put(optionId, translation);
            }
        }
        return selected;
    }

    private boolean isBetterLocaleMatch(String candidateLocale, String currentLocale, String preferredLocale) {
        String candidate = normalizeLocale(candidateLocale);
        String current = normalizeLocale(currentLocale);
        if (current == null) {
            return true;
        }
        boolean candidatePreferred = preferredLocale.equals(candidate);
        boolean currentPreferred = preferredLocale.equals(current);
        if (candidatePreferred != currentPreferred) {
            return candidatePreferred;
        }
        boolean candidateEnglish = "en".equals(candidate);
        boolean currentEnglish = "en".equals(current);
        if (candidateEnglish != currentEnglish) {
            return candidateEnglish;
        }
        return false;
    }

    private String normalizeLocale(String locale) {
        if (locale == null || locale.isBlank()) {
            return null;
        }
        return locale.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveDefinitionTitle(
        TestDefinition definition,
        TestDefinitionTranslation translation
    ) {
        if (translation != null && isNotBlank(translation.getTitle())) {
            return translation.getTitle();
        }
        return definition.getTitle();
    }

    private String resolveDefinitionDescription(
        TestDefinition definition,
        TestDefinitionTranslation translation
    ) {
        if (translation != null && translation.getDescription() != null) {
            return translation.getDescription();
        }
        return definition.getDescription();
    }

    private String resolveQuestionText(TestQuestion question, TestQuestionTranslation translation) {
        if (translation != null && isNotBlank(translation.getQuestionText())) {
            return translation.getQuestionText();
        }
        return question.getQuestion();
    }

    private String resolveOptionLabel(TestAnswerOption option, TestAnswerOptionTranslation translation) {
        if (translation != null && isNotBlank(translation.getLabel())) {
            return translation.getLabel();
        }
        return option.getLabel();
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        return userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private Map<UUID, List<TestAnswerOption>> loadOptionsByQuestion(List<TestQuestion> questions) {
        if (questions.isEmpty()) {
            return Map.of();
        }
        List<UUID> questionIds = questions.stream().map(TestQuestion::getId).toList();
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = testAnswerOptionRepository
            .findByQuestion_IdIn(questionIds)
            .stream()
            .collect(Collectors.groupingBy(option -> option.getQuestion().getId()));
        optionsByQuestion.values()
            .forEach(options -> options.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt())));
        return optionsByQuestion;
    }

    @SuppressWarnings("unchecked")
    private void removeTestFromProfile(User user, UUID testId, TestType testType) {
        UserPsyProfile profile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile == null) {
            return;
        }
        Map<String, Object> profileData = profile.getProfile();
        if (profileData == null || profileData.isEmpty()) {
            return;
        }
        Object testsValue = profileData.get("tests");
        if (testsValue instanceof Map<?, ?> testsMap) {
            Map<String, Object> testsData = (Map<String, Object>) testsMap;
            testsData.remove(testId.toString());
            if (testsData.isEmpty()) {
                profileData.remove("tests");
            }
        }
        Object dimensionsValue = profileData.get("dimensions");
        if (dimensionsValue instanceof Map<?, ?> dimensionsMap) {
            Map<String, Object> dimensions = (Map<String, Object>) dimensionsMap;
            String key = testType.name().toLowerCase(Locale.ROOT);
            dimensions.remove(key);
            if (dimensions.isEmpty()) {
                profileData.remove("dimensions");
            }
        }
        profile.setProfile(profileData);
        userPsyProfileRepository.save(profile);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getOrCreateTestsMap(Map<String, Object> profileData) {
        Object existing = profileData.get("tests");
        if (existing instanceof Map<?, ?> existingMap) {
            return (Map<String, Object>) existingMap;
        }
        return new HashMap<>();
    }

    private Map<UUID, List<UUID>> normalizeAnswers(
        List<TestAnswerRequest> answers,
        Map<UUID, TestQuestion> questionsById
    ) {
        Map<UUID, List<UUID>> answersByQuestion = new HashMap<>();
        for (TestAnswerRequest answer : answers) {
            if (answer == null || answer.questionId() == null) {
                throw new BadRequestException("Risposte non valide");
            }
            if (!questionsById.containsKey(answer.questionId())) {
                throw new BadRequestException("Risposte non valide");
            }
            if (answersByQuestion.containsKey(answer.questionId())) {
                throw new BadRequestException("Risposte duplicate");
            }
            List<UUID> optionIds = Optional.ofNullable(answer.answerOptionIds()).orElse(List.of());
            List<UUID> normalized = optionIds.stream().distinct().toList();
            if (normalized.size() != optionIds.size()) {
                throw new BadRequestException("Risposte duplicate");
            }
            answersByQuestion.put(answer.questionId(), normalized);
        }
        return answersByQuestion;
    }

    private void validateAnswers(
        TestDefinition definition,
        List<TestQuestion> questions,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion,
        Map<UUID, TestAnswerOption> optionsById,
        Map<UUID, List<UUID>> answersByQuestion
    ) {
        boolean isInterestsTest = definition.getTestType() == TestType.INTERESTS;
        for (TestQuestion question : questions) {
            List<TestAnswerOption> options = optionsByQuestion.get(question.getId());
            if (options == null || options.isEmpty()) {
                throw new BadRequestException("Domanda senza opzioni");
            }
            List<UUID> selectedOptions = answersByQuestion.getOrDefault(question.getId(), List.of());
            if (question.isRequired() && selectedOptions.isEmpty()) {
                throw new BadRequestException("Risposte mancanti");
            }
            if (!isInterestsTest) {
                int maxSelections = resolveMaxSelections(question, options);
                if (selectedOptions.size() > maxSelections) {
                    throw new BadRequestException("Troppe risposte selezionate");
                }
            }
            if (question.getQuestionType() == TestQuestionType.SINGLE && selectedOptions.size() > 1) {
                throw new BadRequestException("Risposte non valide");
            }
            for (UUID optionId : selectedOptions) {
                TestAnswerOption option = optionsById.get(optionId);
                if (option == null || !option.getQuestion().getId().equals(question.getId())) {
                    throw new BadRequestException("Risposte non valide");
                }
            }
        }
    }

    private int resolveMaxSelections(TestQuestion question, List<TestAnswerOption> options) {
        if (question.getQuestionType() == TestQuestionType.SINGLE) {
            return 1;
        }
        Integer maxSelections = question.getMaxSelections();
        if (maxSelections == null || maxSelections < 1) {
            return options.size();
        }
        return Math.min(maxSelections, options.size());
    }

    private Map<String, Object> buildScorePayload(
        TestDefinition definition,
        List<TestQuestion> questions,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion,
        Map<UUID, TestAnswerOption> optionsById,
        Map<UUID, List<UUID>> answersByQuestion
    ) {
        if (definition.getScoringStrategy() == TestScoringStrategy.CLUSTER_SCORE) {
            return buildClusterScorePayload(definition, optionsByQuestion, optionsById, answersByQuestion);
        }
        if (definition.getScoringStrategy() == TestScoringStrategy.AXES_SCORE) {
            return buildAxesScorePayload(definition, optionsById, answersByQuestion);
        }
        return buildSingleScorePayload(questions, optionsByQuestion, optionsById, answersByQuestion);
    }

    private Map<String, Object> buildSingleScorePayload(
        List<TestQuestion> questions,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion,
        Map<UUID, TestAnswerOption> optionsById,
        Map<UUID, List<UUID>> answersByQuestion
    ) {
        int rawScore = 0;
        int minScore = 0;
        int maxScore = 0;
        for (TestQuestion question : questions) {
            List<TestAnswerOption> options = optionsByQuestion.get(question.getId());
            if (options == null || options.isEmpty()) {
                throw new BadRequestException("Domanda senza opzioni");
            }
            List<Integer> weights = options.stream()
                .map(TestAnswerOption::getWeight)
                .sorted()
                .toList();
            int maxSelections = resolveMaxSelections(question, options);
            int minSelections = question.isRequired() ? 1 : 0;
            minScore += sumSmallest(weights, minSelections);
            maxScore += sumLargest(weights, maxSelections);
            List<UUID> selected = answersByQuestion.getOrDefault(question.getId(), List.of());
            for (UUID optionId : selected) {
                TestAnswerOption option = optionsById.get(optionId);
                if (option != null) {
                    rawScore += option.getWeight();
                }
            }
        }
        int normalizedScore = maxScore == minScore
            ? 0
            : (int) Math.round(100.0 * (rawScore - minScore) / (maxScore - minScore));
        normalizedScore = Math.max(0, Math.min(100, normalizedScore));
        Map<String, Object> payload = new HashMap<>();
        payload.put("rawScore", rawScore);
        payload.put("minScore", minScore);
        payload.put("maxScore", maxScore);
        payload.put("normalizedScore", normalizedScore);
        return payload;
    }

    private Map<String, Object> buildClusterScorePayload(
        TestDefinition definition,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion,
        Map<UUID, TestAnswerOption> optionsById,
        Map<UUID, List<UUID>> answersByQuestion
    ) {
        Map<String, Integer> clusterMax = new HashMap<>();
        Map<String, Integer> clusterScores = new HashMap<>();

        optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .forEach(option -> {
                String clusterId = readClusterId(option.getMetadata());
                if (clusterId == null) {
                    return;
                }
                clusterMax.merge(clusterId, option.getWeight(), Integer::sum);
            });

        answersByQuestion.values().stream()
            .flatMap(List::stream)
            .forEach(optionId -> {
                TestAnswerOption option = optionsById.get(optionId);
                if (option == null) {
                    return;
                }
                String clusterId = readClusterId(option.getMetadata());
                if (clusterId == null) {
                    throw new BadRequestException("Cluster mancante per opzione risposta");
                }
                clusterScores.merge(clusterId, option.getWeight(), Integer::sum);
            });

        Map<String, Integer> clusterNormalized = new HashMap<>();
        clusterMax.forEach((clusterId, maxScore) -> {
            int rawScore = clusterScores.getOrDefault(clusterId, 0);
            int normalized = maxScore == 0
                ? 0
                : (int) Math.round(100.0 * rawScore / maxScore);
            clusterNormalized.put(clusterId, Math.max(0, Math.min(100, normalized)));
        });

        Map<String, Object> payload = new HashMap<>();
        payload.put("clusters", clusterScores);
        payload.put("clustersNormalized", clusterNormalized);
        Map<String, Object> profile = resolveInterestProfile(clusterScores, definition);
        if (!profile.isEmpty()) {
            payload.put("profile", profile);
        }
        Map<String, Object> domainNotes = readDomainNotes(definition.getConfig());
        if (!domainNotes.isEmpty()) {
            payload.put("domainNotes", domainNotes);
        }
        return payload;
    }

    private String readClusterId(Map<String, Object> metadata) {
        if (metadata == null) {
            return null;
        }
        Object value = metadata.get("clusterId");
        if (value == null) {
            return null;
        }
        return String.valueOf(value).trim();
    }

    private Map<String, Object> buildAxesScorePayload(
        TestDefinition definition,
        Map<UUID, TestAnswerOption> optionsById,
        Map<UUID, List<UUID>> answersByQuestion
    ) {
        Map<String, Integer> axesScores = new HashMap<>();

        answersByQuestion.values().stream()
            .flatMap(List::stream)
            .forEach(optionId -> {
                TestAnswerOption option = optionsById.get(optionId);
                if (option == null) {
                    return;
                }
                Map<String, Integer> axes = readAxes(option.getMetadata());
                axes.forEach((axis, value) -> axesScores.merge(axis, value, Integer::sum));
            });

        Map<String, Object> payload = new HashMap<>();
        payload.put("axes", axesScores);

        Map<String, Object> profile = resolveAxesProfile(axesScores, definition);
        if (!profile.isEmpty()) {
            payload.put("profile", profile);
        }

        return payload;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Integer> readAxes(Map<String, Object> metadata) {
        if (metadata == null) {
            return Map.of();
        }
        Object axes = metadata.get("axes");
        if (!(axes instanceof Map<?, ?> axesMap)) {
            return Map.of();
        }
        Map<String, Integer> result = new HashMap<>();
        axesMap.forEach((key, value) -> {
            if (key instanceof String axisName && value instanceof Number number) {
                result.put(axisName, number.intValue());
            }
        });
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> resolveAxesProfile(
        Map<String, Integer> axesScores,
        TestDefinition definition
    ) {
        if (axesScores.isEmpty()) {
            return Map.of();
        }
        Map<String, Object> config = definition.getConfig();
        if (config == null) {
            return Map.of();
        }
        Object profilesObj = config.get("profiles");
        if (!(profilesObj instanceof Map<?, ?> profilesMap)) {
            return Map.of();
        }

        String selectedCode = null;
        Map<String, Object> selectedProfile = null;

        for (Map.Entry<?, ?> entry : profilesMap.entrySet()) {
            if (!(entry.getKey() instanceof String code)) continue;
            if (!(entry.getValue() instanceof Map<?, ?> profileData)) continue;

            Object conditionObj = profileData.get("condition");
            if (conditionObj == null) continue;
            String condition = String.valueOf(conditionObj);

            if ("DEFAULT".equalsIgnoreCase(condition)) {
                if (selectedCode == null) {
                    selectedCode = code;
                    selectedProfile = (Map<String, Object>) profileData;
                }
                continue;
            }

            if (evaluateCondition(condition, axesScores)) {
                selectedCode = code;
                selectedProfile = (Map<String, Object>) profileData;
                break;
            }
        }

        if (selectedCode == null || selectedProfile == null) {
            return Map.of();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("code", selectedCode);
        if (selectedProfile.get("name") != null) {
            result.put("name", selectedProfile.get("name"));
        }
        if (selectedProfile.get("description") != null) {
            result.put("description", selectedProfile.get("description"));
        }
        return result;
    }

    private boolean evaluateCondition(String condition, Map<String, Integer> axesScores) {
        if (condition == null || condition.isBlank()) {
            return false;
        }
        String[] parts = condition.split("\\s+AND\\s+", -1);
        for (String part : parts) {
            if (!evaluateSingleCondition(part.trim(), axesScores)) {
                return false;
            }
        }
        return true;
    }

    private boolean evaluateSingleCondition(String expr, Map<String, Integer> axesScores) {
        String[] geqParts = expr.split(">=", 2);
        if (geqParts.length == 2) {
            String axis = geqParts[0].trim();
            int threshold = parseIntSafe(geqParts[1].trim());
            return axesScores.getOrDefault(axis, 0) >= threshold;
        }
        String[] ltParts = expr.split("<", 2);
        if (ltParts.length == 2) {
            String axis = ltParts[0].trim();
            int threshold = parseIntSafe(ltParts[1].trim());
            return axesScores.getOrDefault(axis, 0) < threshold;
        }
        String[] gtParts = expr.split(">", 2);
        if (gtParts.length == 2) {
            String axis = gtParts[0].trim();
            int threshold = parseIntSafe(gtParts[1].trim());
            return axesScores.getOrDefault(axis, 0) > threshold;
        }
        return false;
    }

    private int parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Map<String, Object> resolveInterestProfile(
        Map<String, Integer> clusterScores,
        TestDefinition definition
    ) {
        if (definition.getTestType() != TestType.INTERESTS) {
            return Map.of();
        }
        if (clusterScores.isEmpty()) {
            return Map.of();
        }
        Map<String, Object> config = definition.getConfig();
        List<Map<String, Object>> profiles = readProfiles(config);
        Map<String, Map<String, Object>> profilesByCluster = profiles.stream()
            .filter(profile -> profile.get("clusterId") != null)
            .collect(Collectors.toMap(
                profile -> String.valueOf(profile.get("clusterId")),
                Function.identity(),
                (a, b) -> a
            ));
        Map<String, Map<String, Object>> profilesByCode = profiles.stream()
            .filter(profile -> profile.get("code") != null)
            .collect(Collectors.toMap(
                profile -> String.valueOf(profile.get("code")).toUpperCase(Locale.ROOT),
                Function.identity(),
                (a, b) -> a
            ));

        List<Map.Entry<String, Integer>> sortedScores = clusterScores.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
            .toList();
        Map.Entry<String, Integer> top = sortedScores.get(0);
        int topScore = top.getValue();
        int secondScore = sortedScores.size() > 1 ? sortedScores.get(1).getValue() : 0;
        int dominanceDelta = readInt(config, "dominanceDelta", 2);

        String selectedCode = "P5";
        if (topScore >= 4 && (topScore - secondScore) >= dominanceDelta) {
            selectedCode = switch (top.getKey()) {
                case "I1" -> "P1";
                case "I2" -> "P2";
                case "I3" -> "P3";
                case "I4" -> "P4";
                default -> "P5";
            };
        }

        Map<String, Object> profile = new HashMap<>();
        Map<String, Object> selectedProfile = profilesByCode.get(selectedCode);
        if (selectedProfile == null) {
            selectedProfile = profilesByCluster.getOrDefault(top.getKey(), Map.of());
        }
        profile.put("code", selectedCode);
        if (selectedProfile.get("label") != null) {
            profile.put("label", selectedProfile.get("label"));
        } else {
            profile.put("label", defaultProfileLabel(selectedCode));
        }
        if (selectedProfile.get("description") != null) {
            profile.put("description", selectedProfile.get("description"));
        }
        profile.put("dominantCluster", top.getKey());
        return profile;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> readProfiles(Map<String, Object> config) {
        if (config == null) {
            return List.of();
        }
        Object profiles = config.get("profiles");
        if (profiles instanceof List<?> list) {
            return list.stream()
                .filter(item -> item instanceof Map<?, ?>)
                .map(item -> (Map<String, Object>) item)
                .toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readDomainNotes(Map<String, Object> config) {
        if (config == null) {
            return Map.of();
        }
        Object notes = config.get("domainNotes");
        if (notes instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private int readInt(Map<String, Object> config, String key, int fallback) {
        if (config == null) {
            return fallback;
        }
        Object value = config.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private int sumSmallest(List<Integer> values, int count) {
        if (count <= 0 || values.isEmpty()) {
            return 0;
        }
        return values.stream().limit(count).mapToInt(Integer::intValue).sum();
    }

    private int sumLargest(List<Integer> values, int count) {
        if (count <= 0 || values.isEmpty()) {
            return 0;
        }
        return values.stream()
            .sorted(Comparator.reverseOrder())
            .limit(count)
            .mapToInt(Integer::intValue)
            .sum();
    }

    @SuppressWarnings("unchecked")
    private void updateProfileDimensions(
        Map<String, Object> profileData,
        TestDefinition definition,
        Map<String, Object> scorePayload,
        int confidence
    ) {
        Map<String, Object> dimensions = Optional.ofNullable(profileData.get("dimensions"))
            .filter(Map.class::isInstance)
            .map(value -> (Map<String, Object>) value)
            .orElseGet(HashMap::new);
        String key = definition.getTestType().name().toLowerCase(Locale.ROOT);
        Map<String, Object> dimension = new HashMap<>();
        dimension.put("confidence", confidence);
        if (definition.getScoringStrategy() == TestScoringStrategy.CLUSTER_SCORE) {
            Object clusters = scorePayload.get("clustersNormalized");
            if (clusters == null) {
                clusters = scorePayload.get("clusters");
            }
            if (clusters != null) {
                dimension.put("score", clusters);
            }
            if (scorePayload.get("profile") != null) {
                dimension.put("profile", scorePayload.get("profile"));
            }
        } else if (definition.getScoringStrategy() == TestScoringStrategy.AXES_SCORE) {
            Object axes = scorePayload.get("axes");
            if (axes != null) {
                dimension.put("score", axes);
            }
            if (scorePayload.get("profile") != null) {
                dimension.put("profile", scorePayload.get("profile"));
            }
        } else if (scorePayload.get("normalizedScore") != null) {
            dimension.put("score", scorePayload.get("normalizedScore"));
        }
        dimensions.put(key, dimension);
        profileData.put("dimensions", dimensions);
    }

    private String defaultProfileLabel(String code) {
        return switch (code) {
            case "P1" -> "Esploratore di Esperienze";
            case "P2" -> "Connettore Sociale";
            case "P3" -> "Orientato alla Crescita";
            case "P4" -> "Benessere e Qualita";
            case "P5" -> "Ibrido";
            default -> "Profilo";
        };
    }

    /**
     * Aggiorna il punteggio aggregato per il tipo di test completato.
     * Questo permette query rapide sui punteggi senza dover parsare il JSON.
     */
    private void updateAggregatedScore(
        UserPsyProfile profile,
        TestDefinition definition,
        Map<String, Object> scorePayload
    ) {
        Integer score = extractNormalizedScore(scorePayload, definition.getScoringStrategy());
        if (score == null) {
            return;
        }

        switch (definition.getTestType()) {
            case INTERESTS -> profile.setInterestsScore(score);
            case LIFESTYLE -> profile.setLifestyleScore(score);
            case VALUES -> profile.setValuesScore(score);
            case OBJECTIVES -> profile.setObjectivesScore(score);
            case PSY -> profile.setPsyScore(score);
            case ASTRO -> profile.setAstroScore(score);
            default -> { /* OTHER: non salvare score aggregato */ }
        }
    }

    /**
     * Estrae il punteggio normalizzato (0-100) dal payload.
     */
    @SuppressWarnings("unchecked")
    private Integer extractNormalizedScore(Map<String, Object> scorePayload, TestScoringStrategy strategy) {
        if (scorePayload == null) {
            return null;
        }

        // SINGLE_SCORE: usa normalizedScore direttamente
        Object normalizedScore = scorePayload.get("normalizedScore");
        if (normalizedScore instanceof Number) {
            return ((Number) normalizedScore).intValue();
        }

        // CLUSTER_SCORE: calcola media dei cluster normalizzati
        if (strategy == TestScoringStrategy.CLUSTER_SCORE) {
            Object clusters = scorePayload.get("clustersNormalized");
            if (clusters instanceof Map) {
                Map<String, Object> clustersMap = (Map<String, Object>) clusters;
                if (clustersMap.isEmpty()) {
                    return null;
                }
                double sum = 0;
                int count = 0;
                for (Object value : clustersMap.values()) {
                    if (value instanceof Number) {
                        sum += ((Number) value).doubleValue();
                        count++;
                    }
                }
                return count > 0 ? (int) Math.round(sum / count) : null;
            }
        }

        // AXES_SCORE: calcola score medio dagli assi
        if (strategy == TestScoringStrategy.AXES_SCORE) {
            Object axes = scorePayload.get("axes");
            if (axes instanceof Map) {
                Map<String, Object> axesMap = (Map<String, Object>) axes;
                if (axesMap.isEmpty()) {
                    return null;
                }
                // Per gli assi, normalizziamo assumendo un range tipico
                double sum = 0;
                int count = 0;
                for (Object value : axesMap.values()) {
                    if (value instanceof Number) {
                        // Assumiamo che i valori degli assi siano gia in un range ragionevole
                        // e li normalizziamo a 0-100 basandoci sul valore assoluto
                        int axisValue = ((Number) value).intValue();
                        // Mappa da -50/+50 tipico a 0-100
                        int normalized = Math.max(0, Math.min(100, 50 + axisValue));
                        sum += normalized;
                        count++;
                    }
                }
                return count > 0 ? (int) Math.round(sum / count) : null;
            }
        }

        return null;
    }

    /**
     * Aggiorna i campi astrologici (sunSign, moonSign, ascSign, venusSign, marsSign)
     * nel UserProfile basandosi sulle risposte del test ASTRO.
     * I metadata delle opzioni devono contenere "point" (SUN, MOON, ASC, VENUS, MARS)
     * e "sign" (il segno zodiacale).
     */
    private void updateAstroSignsInProfile(
        User user,
        Map<UUID, List<UUID>> answersByQuestion,
        Map<UUID, TestAnswerOption> optionsById
    ) {
        UserProfile userProfile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (userProfile == null) {
            return;
        }

        boolean updated = false;

        for (List<UUID> optionIds : answersByQuestion.values()) {
            for (UUID optionId : optionIds) {
                TestAnswerOption option = optionsById.get(optionId);
                if (option == null) {
                    continue;
                }
                Map<String, Object> metadata = option.getMetadata();
                if (metadata == null || metadata.isEmpty()) {
                    continue;
                }

                Object pointObj = metadata.get("point");
                Object signObj = metadata.get("sign");
                if (pointObj == null || signObj == null) {
                    continue;
                }

                String point = String.valueOf(pointObj).trim().toUpperCase(Locale.ROOT);
                String signStr = String.valueOf(signObj).trim().toUpperCase(Locale.ROOT);

                if (signStr.isEmpty() || "UNKNOWN".equals(signStr)) {
                    continue;
                }

                ZodiacSign sign;
                try {
                    sign = ZodiacSign.valueOf(signStr);
                } catch (IllegalArgumentException e) {
                    continue;
                }

                switch (point) {
                    case "SUN" -> {
                        userProfile.setSunSign(sign);
                        // Aggiorna anche zodiacSign se non gia impostato
                        if (userProfile.getZodiacSign() == null) {
                            userProfile.setZodiacSign(sign);
                        }
                        updated = true;
                    }
                    case "MOON" -> {
                        userProfile.setMoonSign(sign);
                        updated = true;
                    }
                    case "ASC" -> {
                        userProfile.setAscSign(sign);
                        updated = true;
                    }
                    case "VENUS" -> {
                        userProfile.setVenusSign(sign);
                        updated = true;
                    }
                    case "MARS" -> {
                        userProfile.setMarsSign(sign);
                        updated = true;
                    }
                    default -> { /* punto astrologico non gestito, ignora */ }
                }
            }
        }

        if (updated) {
            userProfileRepository.save(userProfile);
        }
    }

    private void clearBirthChartFromProfile(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return;
        }
        profile.setSunSign(null);
        profile.setMoonSign(null);
        profile.setAscSign(null);
        profile.setVenusSign(null);
        profile.setMarsSign(null);
        profile.setSunDegree(null);
        profile.setMoonDegree(null);
        profile.setAscDegree(null);
        profile.setVenusDegree(null);
        profile.setMarsDegree(null);
        profile.setBirthPlace(null);
        profile.setBirthLatitude(null);
        profile.setBirthLongitude(null);
        profile.setBirthTime(null);
        profile.setZodiacSign(null);
        profile.setZyraBirthChartInterpretation(null);
        userProfileRepository.save(profile);
    }
}
