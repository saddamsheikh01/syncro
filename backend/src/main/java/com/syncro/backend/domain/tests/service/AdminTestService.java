package com.syncro.backend.domain.tests.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionRequest;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionTranslationResponse;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionTranslationUpsertRequest;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionUpdateRequest;
import com.syncro.backend.domain.tests.dto.AdminTestDefinitionRequest;
import com.syncro.backend.domain.tests.dto.AdminTestDefinitionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestDefinitionUpdateRequest;
import com.syncro.backend.domain.tests.dto.AdminTestDetailResponse;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionRequest;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionTranslationResponse;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionTranslationUpsertRequest;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionUpdateRequest;
import com.syncro.backend.domain.tests.dto.AdminTestTranslationResponse;
import com.syncro.backend.domain.tests.dto.AdminTestTranslationUpsertRequest;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestAnswerOptionTranslation;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestDefinitionTranslation;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import com.syncro.backend.domain.tests.entity.TestQuestionTranslation;
import com.syncro.backend.domain.tests.mapper.TestMapper;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionRepository;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionTranslationRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionTranslationRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionTranslationRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.domain.zyra.client.ZyraChatMessage;
import com.syncro.backend.domain.zyra.client.ZyraClient;
import com.syncro.backend.domain.zyra.config.PromptLoader;
import com.syncro.backend.domain.zyra.config.PromptType;
import com.syncro.backend.security.AdminPrincipal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminTestService {

    private static final Set<String> SUPPORTED_LOCALES = Set.of("en", "it", "es", "fr");
    private static final List<String> AUTO_TRANSLATION_LOCALES = List.of("it", "es", "fr");

    private final TestDefinitionRepository testDefinitionRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerOptionRepository testAnswerOptionRepository;
    private final TestDefinitionTranslationRepository testDefinitionTranslationRepository;
    private final TestQuestionTranslationRepository testQuestionTranslationRepository;
    private final TestAnswerOptionTranslationRepository testAnswerOptionTranslationRepository;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final ZyraClient zyraClient;
    private final PromptLoader promptLoader;
    private final TestMapper testMapper;

    public AdminTestService(
        TestDefinitionRepository testDefinitionRepository,
        TestQuestionRepository testQuestionRepository,
        TestAnswerOptionRepository testAnswerOptionRepository,
        TestDefinitionTranslationRepository testDefinitionTranslationRepository,
        TestQuestionTranslationRepository testQuestionTranslationRepository,
        TestAnswerOptionTranslationRepository testAnswerOptionTranslationRepository,
        UserTestSubmissionRepository userTestSubmissionRepository,
        UserTestAnswerRepository userTestAnswerRepository,
        ZyraClient zyraClient,
        PromptLoader promptLoader,
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
        this.zyraClient = zyraClient;
        this.promptLoader = promptLoader;
        this.testMapper = testMapper;
    }

    @Transactional(readOnly = true)
    public List<AdminTestDefinitionResponse> getTests(AdminPrincipal principal) {
        ensureSuperAdmin(principal);
        return testDefinitionRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(testMapper::toAdminDefinitionResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminTestDetailResponse getTest(AdminPrincipal principal, UUID testId) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        return testMapper.toAdminDetailResponse(definition, questions, optionsByQuestion);
    }

    @Transactional(readOnly = true)
    public AdminTestTranslationResponse getTestTranslations(
        AdminPrincipal principal,
        UUID testId,
        String locale
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        String normalizedLocale = resolveLocale(locale);

        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        List<UUID> questionIds = questions.stream().map(TestQuestion::getId).toList();
        List<UUID> optionIds = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .map(TestAnswerOption::getId)
            .toList();

        TestDefinitionTranslation definitionTranslation = testDefinitionTranslationRepository
            .findByTestDefinition_IdAndLocale(definition.getId(), normalizedLocale)
            .orElse(null);
        Map<UUID, TestQuestionTranslation> questionTranslations = loadQuestionTranslationsByLocale(
            questionIds,
            normalizedLocale
        );
        Map<UUID, TestAnswerOptionTranslation> optionTranslations = loadOptionTranslationsByLocale(
            optionIds,
            normalizedLocale
        );

        List<AdminTestQuestionTranslationResponse> questionResponses = questions.stream()
            .map(question -> {
                TestQuestionTranslation questionTranslation = questionTranslations.get(question.getId());
                List<AdminTestAnswerOptionTranslationResponse> optionResponses = optionsByQuestion
                    .getOrDefault(question.getId(), List.of())
                    .stream()
                    .map(option -> {
                        TestAnswerOptionTranslation optionTranslation = optionTranslations.get(option.getId());
                        return new AdminTestAnswerOptionTranslationResponse(
                            option.getId(),
                            optionTranslation != null ? optionTranslation.getLabel() : null
                        );
                    })
                    .toList();
                return new AdminTestQuestionTranslationResponse(
                    question.getId(),
                    questionTranslation != null ? questionTranslation.getQuestionText() : null,
                    optionResponses
                );
            })
            .toList();

        return new AdminTestTranslationResponse(
            definition.getId(),
            normalizedLocale,
            definitionTranslation != null ? definitionTranslation.getTitle() : null,
            definitionTranslation != null ? definitionTranslation.getDescription() : null,
            questionResponses
        );
    }

    @Transactional
    public AdminTestTranslationResponse upsertTestTranslations(
        AdminPrincipal principal,
        UUID testId,
        String locale,
        AdminTestTranslationUpsertRequest request
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        String normalizedLocale = resolveLocale(locale);

        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, TestQuestion> questionsById = questions.stream()
            .collect(Collectors.toMap(TestQuestion::getId, question -> question));
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        Map<UUID, TestAnswerOption> optionsById = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .collect(Collectors.toMap(TestAnswerOption::getId, option -> option));

        TestDefinitionTranslation definitionTranslation = testDefinitionTranslationRepository
            .findByTestDefinition_IdAndLocale(definition.getId(), normalizedLocale)
            .orElseGet(() -> {
                TestDefinitionTranslation created = new TestDefinitionTranslation();
                created.setTestDefinition(definition);
                created.setLocale(normalizedLocale);
                return created;
            });
        definitionTranslation.setTitle(normalizeRequired(request.title()));
        definitionTranslation.setDescription(normalizeOptional(request.description()));
        testDefinitionTranslationRepository.save(definitionTranslation);

        List<UUID> requestQuestionIds = request.questions().stream()
            .map(AdminTestQuestionTranslationUpsertRequest::questionId)
            .toList();
        Map<UUID, TestQuestionTranslation> existingQuestionTranslations = loadQuestionTranslationsByLocale(
            requestQuestionIds,
            normalizedLocale
        );

        List<UUID> requestOptionIds = request.questions().stream()
            .flatMap(question -> question.options().stream())
            .map(AdminTestAnswerOptionTranslationUpsertRequest::optionId)
            .toList();
        Map<UUID, TestAnswerOptionTranslation> existingOptionTranslations = loadOptionTranslationsByLocale(
            requestOptionIds,
            normalizedLocale
        );

        for (AdminTestQuestionTranslationUpsertRequest questionRequest : request.questions()) {
            TestQuestion question = questionsById.get(questionRequest.questionId());
            if (question == null) {
                throw new BadRequestException("Domanda non valida per questo test");
            }

            TestQuestionTranslation questionTranslation = existingQuestionTranslations
                .get(question.getId());
            if (questionTranslation == null) {
                questionTranslation = new TestQuestionTranslation();
                questionTranslation.setQuestion(question);
                questionTranslation.setLocale(normalizedLocale);
            }
            questionTranslation.setQuestionText(normalizeRequired(questionRequest.questionText()));
            testQuestionTranslationRepository.save(questionTranslation);

            for (AdminTestAnswerOptionTranslationUpsertRequest optionRequest : questionRequest.options()) {
                TestAnswerOption option = optionsById.get(optionRequest.optionId());
                if (option == null || !option.getQuestion().getId().equals(question.getId())) {
                    throw new BadRequestException("Opzione non valida per questa domanda");
                }
                TestAnswerOptionTranslation optionTranslation = existingOptionTranslations
                    .get(option.getId());
                if (optionTranslation == null) {
                    optionTranslation = new TestAnswerOptionTranslation();
                    optionTranslation.setOption(option);
                    optionTranslation.setLocale(normalizedLocale);
                }
                optionTranslation.setLabel(normalizeRequired(optionRequest.label()));
                testAnswerOptionTranslationRepository.save(optionTranslation);
            }
        }

        return getTestTranslations(principal, testId, normalizedLocale);
    }

    @Transactional
    public AdminTestTranslationResponse autoTranslateTest(
        AdminPrincipal principal,
        UUID testId,
        String locale
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        String normalizedLocale = resolveLocale(locale);

        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        List<UUID> questionIds = questions.stream().map(TestQuestion::getId).toList();
        List<UUID> optionIds = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .map(TestAnswerOption::getId)
            .toList();

        TestDefinitionTranslation englishDefinitionTranslation = testDefinitionTranslationRepository
            .findByTestDefinition_IdAndLocale(definition.getId(), "en")
            .orElse(null);
        Map<UUID, TestQuestionTranslation> englishQuestionTranslations = loadQuestionTranslationsByLocale(questionIds, "en");
        Map<UUID, TestAnswerOptionTranslation> englishOptionTranslations = loadOptionTranslationsByLocale(optionIds, "en");

        autoTranslateToLocale(
            definition,
            questions,
            optionsByQuestion,
            englishDefinitionTranslation,
            englishQuestionTranslations,
            englishOptionTranslations,
            normalizedLocale
        );

        return getTestTranslations(principal, testId, normalizedLocale);
    }

    @Transactional
    public List<AdminTestTranslationResponse> autoTranslateAllTestLocales(
        AdminPrincipal principal,
        UUID testId
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        List<UUID> questionIds = questions.stream().map(TestQuestion::getId).toList();
        List<UUID> optionIds = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .map(TestAnswerOption::getId)
            .toList();

        TestDefinitionTranslation englishDefinitionTranslation = testDefinitionTranslationRepository
            .findByTestDefinition_IdAndLocale(definition.getId(), "en")
            .orElse(null);
        Map<UUID, TestQuestionTranslation> englishQuestionTranslations = loadQuestionTranslationsByLocale(questionIds, "en");
        Map<UUID, TestAnswerOptionTranslation> englishOptionTranslations = loadOptionTranslationsByLocale(optionIds, "en");

        for (String locale : AUTO_TRANSLATION_LOCALES) {
            autoTranslateToLocale(
                definition,
                questions,
                optionsByQuestion,
                englishDefinitionTranslation,
                englishQuestionTranslations,
                englishOptionTranslations,
                locale
            );
        }

        return AUTO_TRANSLATION_LOCALES.stream()
            .map(locale -> getTestTranslations(principal, testId, locale))
            .toList();
    }

    private void autoTranslateToLocale(
        TestDefinition definition,
        List<TestQuestion> questions,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion,
        TestDefinitionTranslation englishDefinitionTranslation,
        Map<UUID, TestQuestionTranslation> englishQuestionTranslations,
        Map<UUID, TestAnswerOptionTranslation> englishOptionTranslations,
        String normalizedLocale
    ) {
        TestDefinitionTranslation targetDefinitionTranslation = testDefinitionTranslationRepository
            .findByTestDefinition_IdAndLocale(definition.getId(), normalizedLocale)
            .orElseGet(() -> {
                TestDefinitionTranslation created = new TestDefinitionTranslation();
                created.setTestDefinition(definition);
                created.setLocale(normalizedLocale);
                return created;
            });
        targetDefinitionTranslation.setTitle(
            normalizeRequired(
                translateForLocale(
                    resolveSourceDefinitionTitle(definition, englishDefinitionTranslation),
                    normalizedLocale
                )
            )
        );
        targetDefinitionTranslation.setDescription(
            normalizeOptional(
                translateForLocale(
                    resolveSourceDefinitionDescription(definition, englishDefinitionTranslation),
                    normalizedLocale
                )
            )
        );
        testDefinitionTranslationRepository.save(targetDefinitionTranslation);

        List<UUID> questionIds = questions.stream().map(TestQuestion::getId).toList();
        List<UUID> optionIds = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .map(TestAnswerOption::getId)
            .toList();
        Map<UUID, TestQuestionTranslation> targetQuestionTranslations = loadQuestionTranslationsByLocale(
            questionIds,
            normalizedLocale
        );
        Map<UUID, TestAnswerOptionTranslation> targetOptionTranslations = loadOptionTranslationsByLocale(
            optionIds,
            normalizedLocale
        );

        for (TestQuestion question : questions) {
            TestQuestionTranslation targetQuestionTranslation = targetQuestionTranslations.get(question.getId());
            if (targetQuestionTranslation == null) {
                targetQuestionTranslation = new TestQuestionTranslation();
                targetQuestionTranslation.setQuestion(question);
                targetQuestionTranslation.setLocale(normalizedLocale);
            }
            targetQuestionTranslation.setQuestionText(
                normalizeRequired(
                    translateForLocale(
                        resolveSourceQuestionText(question, englishQuestionTranslations.get(question.getId())),
                        normalizedLocale
                    )
                )
            );
            testQuestionTranslationRepository.save(targetQuestionTranslation);

            for (TestAnswerOption option : optionsByQuestion.getOrDefault(question.getId(), List.of())) {
                TestAnswerOptionTranslation targetOptionTranslation = targetOptionTranslations.get(option.getId());
                if (targetOptionTranslation == null) {
                    targetOptionTranslation = new TestAnswerOptionTranslation();
                    targetOptionTranslation.setOption(option);
                    targetOptionTranslation.setLocale(normalizedLocale);
                }
                targetOptionTranslation.setLabel(
                    normalizeRequired(
                        translateForLocale(
                            resolveSourceOptionLabel(option, englishOptionTranslations.get(option.getId())),
                            normalizedLocale
                        )
                    )
                );
                testAnswerOptionTranslationRepository.save(targetOptionTranslation);
            }
        }
    }

    @Transactional
    public AdminTestDefinitionResponse createTest(AdminPrincipal principal, AdminTestDefinitionRequest request) {
        ensureSuperAdmin(principal);
        TestDefinition definition = new TestDefinition();
        definition.setTitle(normalizeRequired(request.title()));
        definition.setDescription(normalizeOptional(request.description()));
        definition.setActive(request.active() != null ? request.active() : true);
        if (request.testType() != null) {
            definition.setTestType(request.testType());
        }
        if (request.scoringStrategy() != null) {
            definition.setScoringStrategy(request.scoringStrategy());
        }
        if (request.config() != null) {
            definition.setConfig(request.config());
        }
        TestDefinition saved = testDefinitionRepository.save(definition);
        return testMapper.toAdminDefinitionResponse(saved);
    }

    @Transactional
    public AdminTestDefinitionResponse updateTest(
        AdminPrincipal principal,
        UUID testId,
        AdminTestDefinitionUpdateRequest request
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        if (request.title() != null) {
            definition.setTitle(normalizeRequired(request.title()));
        }
        if (request.description() != null) {
            definition.setDescription(normalizeOptional(request.description()));
        }
        if (request.active() != null) {
            definition.setActive(request.active());
        }
        if (request.testType() != null) {
            definition.setTestType(request.testType());
        }
        if (request.scoringStrategy() != null) {
            definition.setScoringStrategy(request.scoringStrategy());
        }
        if (request.config() != null) {
            definition.setConfig(request.config());
        }
        TestDefinition saved = testDefinitionRepository.save(definition);
        return testMapper.toAdminDefinitionResponse(saved);
    }

    @Transactional
    public void deleteTest(AdminPrincipal principal, UUID testId) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        if (userTestSubmissionRepository.existsByTestDefinitionId(definition.getId())) {
            throw new ConflictException("Test gia utilizzato");
        }
        testDefinitionRepository.delete(definition);
    }

    @Transactional
    public AdminTestQuestionResponse createQuestion(
        AdminPrincipal principal,
        UUID testId,
        AdminTestQuestionRequest request
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        TestQuestion question = new TestQuestion();
        question.setTestDefinition(definition);
        question.setQuestion(normalizeRequired(request.question()));
        question.setPosition(request.position());
        if (request.questionType() != null) {
            question.setQuestionType(request.questionType());
        }
        if (request.required() != null) {
            question.setRequired(request.required());
        }
        if (request.maxSelections() != null) {
            question.setMaxSelections(request.maxSelections());
        }
        TestQuestion saved = testQuestionRepository.save(question);
        return testMapper.toAdminQuestionResponse(saved);
    }

    @Transactional
    public AdminTestQuestionResponse updateQuestion(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        AdminTestQuestionUpdateRequest request
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        if (request.question() != null) {
            question.setQuestion(normalizeRequired(request.question()));
        }
        if (request.position() != null) {
            question.setPosition(request.position());
        }
        if (request.questionType() != null) {
            question.setQuestionType(request.questionType());
        }
        if (request.required() != null) {
            question.setRequired(request.required());
        }
        if (request.maxSelections() != null) {
            question.setMaxSelections(request.maxSelections());
        }
        TestQuestion saved = testQuestionRepository.save(question);
        return testMapper.toAdminQuestionResponse(saved);
    }

    @Transactional
    public void deleteQuestion(AdminPrincipal principal, UUID testId, UUID questionId) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        if (userTestAnswerRepository.existsByQuestion_Id(question.getId())) {
            throw new ConflictException("Domanda gia utilizzata");
        }
        testQuestionRepository.delete(question);
    }

    @Transactional
    public AdminTestAnswerOptionResponse createAnswerOption(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        AdminTestAnswerOptionRequest request
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        TestAnswerOption option = new TestAnswerOption();
        option.setQuestion(question);
        option.setLabel(normalizeRequired(request.label()));
        option.setWeight(request.weight());
        if (request.metadata() != null) {
            option.setMetadata(request.metadata());
        }
        TestAnswerOption saved = testAnswerOptionRepository.save(option);
        return testMapper.toAdminAnswerOptionResponse(saved);
    }

    @Transactional
    public AdminTestAnswerOptionResponse updateAnswerOption(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        UUID optionId,
        AdminTestAnswerOptionUpdateRequest request
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        TestAnswerOption option = testAnswerOptionRepository.findByIdAndQuestion_Id(optionId, question.getId())
            .orElseThrow(() -> new NotFoundException("Opzione non trovata"));
        if (request.label() != null) {
            option.setLabel(normalizeRequired(request.label()));
        }
        if (request.weight() != null) {
            option.setWeight(request.weight());
        }
        if (request.metadata() != null) {
            option.setMetadata(request.metadata());
        }
        TestAnswerOption saved = testAnswerOptionRepository.save(option);
        return testMapper.toAdminAnswerOptionResponse(saved);
    }

    @Transactional
    public void deleteAnswerOption(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        UUID optionId
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        TestAnswerOption option = testAnswerOptionRepository.findByIdAndQuestion_Id(optionId, question.getId())
            .orElseThrow(() -> new NotFoundException("Opzione non trovata"));
        if (userTestAnswerRepository.existsByAnswerOption_Id(option.getId())) {
            throw new ConflictException("Opzione gia utilizzata");
        }
        testAnswerOptionRepository.delete(option);
    }

    private TestDefinition getDefinition(UUID testId) {
        return testDefinitionRepository.findById(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));
    }

    private TestQuestion getQuestion(UUID testId, UUID questionId) {
        return testQuestionRepository.findByIdAndTestDefinitionId(questionId, testId)
            .orElseThrow(() -> new NotFoundException("Domanda non trovata"));
    }

    private void ensureSuperAdmin(AdminPrincipal principal) {
        if (principal == null || principal.role() == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        if (!AdminRole.SUPER_ADMIN.name().equals(principal.role())) {
            throw new UnauthorizedException("Permesso negato");
        }
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null || normalized.isBlank()) {
            throw new BadRequestException("Valore non valido");
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

    private String resolveLocale(String locale) {
        if (locale == null || locale.isBlank()) {
            throw new BadRequestException("Lingua non valida");
        }
        String normalized = locale.trim().toLowerCase(Locale.ROOT);
        int separatorIndex = normalized.indexOf('-');
        if (separatorIndex > 0) {
            normalized = normalized.substring(0, separatorIndex);
        }
        if (!SUPPORTED_LOCALES.contains(normalized)) {
            throw new BadRequestException("Lingua non supportata");
        }
        return normalized;
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

    private Map<UUID, TestQuestionTranslation> loadQuestionTranslationsByLocale(
        List<UUID> questionIds,
        String locale
    ) {
        if (questionIds == null || questionIds.isEmpty()) {
            return Map.of();
        }
        return testQuestionTranslationRepository.findByQuestion_IdInAndLocale(questionIds, locale)
            .stream()
            .collect(Collectors.toMap(
                translation -> translation.getQuestion().getId(),
                translation -> translation,
                (a, b) -> a
            ));
    }

    private Map<UUID, TestAnswerOptionTranslation> loadOptionTranslationsByLocale(
        List<UUID> optionIds,
        String locale
    ) {
        if (optionIds == null || optionIds.isEmpty()) {
            return Map.of();
        }
        return testAnswerOptionTranslationRepository.findByOption_IdInAndLocale(optionIds, locale)
            .stream()
            .collect(Collectors.toMap(
                translation -> translation.getOption().getId(),
                translation -> translation,
                (a, b) -> a
            ));
    }

    private String resolveSourceDefinitionTitle(
        TestDefinition definition,
        TestDefinitionTranslation englishTranslation
    ) {
        if (englishTranslation != null && isNotBlank(englishTranslation.getTitle())) {
            return englishTranslation.getTitle();
        }
        return definition.getTitle();
    }

    private String resolveSourceDefinitionDescription(
        TestDefinition definition,
        TestDefinitionTranslation englishTranslation
    ) {
        if (englishTranslation != null && englishTranslation.getDescription() != null) {
            return englishTranslation.getDescription();
        }
        return definition.getDescription();
    }

    private String resolveSourceQuestionText(
        TestQuestion question,
        TestQuestionTranslation englishTranslation
    ) {
        if (englishTranslation != null && isNotBlank(englishTranslation.getQuestionText())) {
            return englishTranslation.getQuestionText();
        }
        return question.getQuestion();
    }

    private String resolveSourceOptionLabel(
        TestAnswerOption option,
        TestAnswerOptionTranslation englishTranslation
    ) {
        if (englishTranslation != null && isNotBlank(englishTranslation.getLabel())) {
            return englishTranslation.getLabel();
        }
        return option.getLabel();
    }

    private String translateForLocale(String sourceText, String targetLocale) {
        if (sourceText == null) {
            return null;
        }
        String normalizedSource = sourceText.trim();
        if (normalizedSource.isBlank() || "en".equals(targetLocale)) {
            return normalizedSource;
        }

        String translationInstruction = promptLoader.getPrompt(
            PromptType.RECAP_TRANSLATE_USER,
            Map.of("targetLanguage", mapLanguageLabel(targetLocale))
        );
        String userPrompt = translationInstruction
            + "\n\nText to translate:\n<text>\n"
            + normalizedSource
            + "\n</text>";
        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", promptLoader.getPrompt(PromptType.RECAP_TRANSLATE_SYSTEM)),
            new ZyraChatMessage("user", userPrompt)
        );
        String translated = zyraClient.chat(messages);
        if (translated == null || translated.isBlank()) {
            return normalizedSource;
        }
        return normalizeTranslatedOutput(translated);
    }

    private String mapLanguageLabel(String languageCode) {
        return switch (languageCode) {
            case "it" -> "Italian";
            case "es" -> "Spanish";
            case "fr" -> "French";
            default -> "English";
        };
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeTranslatedOutput(String translated) {
        String cleaned = translated == null ? "" : translated.trim();
        if (cleaned.isBlank()) {
            return cleaned;
        }
        String previous;
        do {
            previous = cleaned;
            cleaned = stripSingleQuotePair(cleaned, "\"", "\"");
            cleaned = stripSingleQuotePair(cleaned, "'", "'");
            cleaned = stripSingleQuotePair(cleaned, "“", "”");
            cleaned = stripSingleQuotePair(cleaned, "‘", "’");
            cleaned = stripSingleQuotePair(cleaned, "`", "`");
        } while (!cleaned.equals(previous));
        return cleaned.trim();
    }

    private String stripSingleQuotePair(String value, String start, String end) {
        if (value.length() < (start.length() + end.length())) {
            return value;
        }
        if (value.startsWith(start) && value.endsWith(end)) {
            return value.substring(start.length(), value.length() - end.length()).trim();
        }
        return value;
    }
}
