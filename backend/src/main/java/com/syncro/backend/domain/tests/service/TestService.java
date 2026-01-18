package com.syncro.backend.domain.tests.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.tests.dto.TestAnswerRequest;
import com.syncro.backend.domain.tests.dto.TestDetailResponse;
import com.syncro.backend.domain.tests.dto.TestListResponse;
import com.syncro.backend.domain.tests.dto.TestSubmissionRequest;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import com.syncro.backend.domain.tests.entity.TestQuestionType;
import com.syncro.backend.domain.tests.entity.TestScoringStrategy;
import com.syncro.backend.domain.tests.entity.TestType;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import com.syncro.backend.domain.tests.mapper.TestMapper;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestService {

    private final TestDefinitionRepository testDefinitionRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerOptionRepository testAnswerOptionRepository;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final UserPsyProfileRepository userPsyProfileRepository;
    private final UserRepository userRepository;
    private final TestMapper testMapper;

    public TestService(
        TestDefinitionRepository testDefinitionRepository,
        TestQuestionRepository testQuestionRepository,
        TestAnswerOptionRepository testAnswerOptionRepository,
        UserTestSubmissionRepository userTestSubmissionRepository,
        UserTestAnswerRepository userTestAnswerRepository,
        UserPsyProfileRepository userPsyProfileRepository,
        UserRepository userRepository,
        TestMapper testMapper
    ) {
        this.testDefinitionRepository = testDefinitionRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAnswerOptionRepository = testAnswerOptionRepository;
        this.userTestSubmissionRepository = userTestSubmissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.userPsyProfileRepository = userPsyProfileRepository;
        this.userRepository = userRepository;
        this.testMapper = testMapper;
    }

    @Transactional(readOnly = true)
    public TestListResponse getTests() {
        List<TestDefinition> tests = testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc();
        return new TestListResponse(tests.stream().map(testMapper::toSummaryResponse).toList());
    }

    @Transactional(readOnly = true)
    public TestDetailResponse getTest(UUID testId) {
        TestDefinition definition = testDefinitionRepository.findByIdAndActiveTrue(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));
        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        return testMapper.toDetailResponse(definition, questions, optionsByQuestion);
    }

    @Transactional
    public void submitTest(UserPrincipal principal, UUID testId, TestSubmissionRequest request) {
        User user = getUser(principal);
        TestDefinition definition = testDefinitionRepository.findByIdAndActiveTrue(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));

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
        validateAnswers(questions, optionsByQuestion, optionsById, answersByQuestion);

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

        UserTestSubmission submission = new UserTestSubmission();
        submission.setUser(user);
        submission.setTestDefinition(definition);
        submission.setScorePayload(scorePayload);
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

        UserPsyProfile profile = userPsyProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserPsyProfile created = new UserPsyProfile();
                created.setUser(user);
                return created;
            });
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
        userPsyProfileRepository.save(profile);
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
        List<TestQuestion> questions,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion,
        Map<UUID, TestAnswerOption> optionsById,
        Map<UUID, List<UUID>> answersByQuestion
    ) {
        for (TestQuestion question : questions) {
            List<TestAnswerOption> options = optionsByQuestion.get(question.getId());
            if (options == null || options.isEmpty()) {
                throw new BadRequestException("Domanda senza opzioni");
            }
            List<UUID> selectedOptions = answersByQuestion.getOrDefault(question.getId(), List.of());
            if (question.isRequired() && selectedOptions.isEmpty()) {
                throw new BadRequestException("Risposte mancanti");
            }
            int maxSelections = resolveMaxSelections(question, options);
            if (selectedOptions.size() > maxSelections) {
                throw new BadRequestException("Troppe risposte selezionate");
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
}
