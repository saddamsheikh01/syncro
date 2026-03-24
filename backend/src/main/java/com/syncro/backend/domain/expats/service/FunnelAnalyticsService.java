package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.expats.dto.FunnelAnalyticsResponse;
import com.syncro.backend.domain.expats.dto.FunnelAnalyticsResponse.*;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityWaitingListRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Servizio per le KPI aggregate del funnel expats.
 * Calcola tasso di completamento, drop-off per step, citta piu richieste e distribuzione risposte.
 */
@Service
public class FunnelAnalyticsService {

    private final ExpatsAnonymousSessionRepository sessionRepository;
    private final ExpatsAnonymousAnswerRepository answerRepository;
    private final RelocationCityWaitingListRepository waitingListRepository;

    public FunnelAnalyticsService(ExpatsAnonymousSessionRepository sessionRepository,
                                   ExpatsAnonymousAnswerRepository answerRepository,
                                   RelocationCityWaitingListRepository waitingListRepository) {
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.waitingListRepository = waitingListRepository;
    }

    @Transactional(readOnly = true)
    public FunnelAnalyticsResponse computeAnalytics() {
        List<ExpatsAnonymousSession> allSessions = sessionRepository.findAll();

        long total = allSessions.size();
        long completed = allSessions.stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
        long converted = allSessions.stream().filter(s -> "CONVERTED".equals(s.getStatus())).count();
        long expired = allSessions.stream().filter(s -> "EXPIRED".equals(s.getStatus())).count();
        long inProgress = allSessions.stream().filter(s -> "IN_PROGRESS".equals(s.getStatus())).count();

        double completionRate = total > 0 ? (double) (completed + converted) / total * 100 : 0;
        double conversionRate = total > 0 ? (double) converted / total * 100 : 0;

        // Drop-off per step
        List<StepDropOff> stepDropOff = computeStepDropOff(allSessions);

        // Citta piu richieste dalle risposte
        List<CityCount> topTargetCities = computeTopCities(allSessions, "targetCityName");
        List<CityCount> topCurrentCities = computeTopCities(allSessions, "currentCityName");

        // Distribuzione risposte per domanda
        List<AnswerDistribution> answerDistributions = computeAnswerDistributions(allSessions);

        // Waiting list top
        List<CityCount> waitingListTop = computeWaitingListTop();

        return new FunnelAnalyticsResponse(
                total, completed, converted, expired, inProgress,
                Math.round(completionRate * 100.0) / 100.0,
                Math.round(conversionRate * 100.0) / 100.0,
                stepDropOff, topTargetCities, topCurrentCities,
                answerDistributions, waitingListTop
        );
    }

    /**
     * Calcola il drop-off per step basandosi sulle risposte effettive, non sul currentStep della sessione.
     * Per ogni sessione, determina il max stepNumber tra le risposte salvate.
     * Se non ha risposte, usa currentStep come fallback.
     */
    private List<StepDropOff> computeStepDropOff(List<ExpatsAnonymousSession> sessions) {
        // Per ogni sessione, calcola lo step massimo raggiunto dalle risposte effettive
        List<Integer> maxSteps = sessions.stream()
                .map(session -> {
                    List<ExpatsAnonymousAnswer> answers = answerRepository.findBySessionIdOrderByStepNumberAsc(session.getId());
                    if (answers.isEmpty()) {
                        return session.getCurrentStep() != null ? session.getCurrentStep() : 1;
                    }
                    return answers.stream()
                            .mapToInt(a -> a.getStepNumber() != null ? a.getStepNumber() : 0)
                            .max()
                            .orElse(session.getCurrentStep() != null ? session.getCurrentStep() : 1);
                })
                .toList();

        List<StepDropOff> dropOff = new ArrayList<>();
        for (int step = 1; step <= 10; step++) {
            int s = step;
            long reached = maxSteps.stream().filter(ms -> ms >= s).count();
            long reachedNext = step < 10
                    ? maxSteps.stream().filter(ms -> ms >= s + 1).count()
                    : sessions.stream().filter(ss -> "COMPLETED".equals(ss.getStatus()) || "CONVERTED".equals(ss.getStatus())).count();
            long dropped = reached - reachedNext;
            double rate = reached > 0 ? (double) dropped / reached * 100 : 0;
            dropOff.add(new StepDropOff(step, reached, dropped, Math.round(rate * 100.0) / 100.0));
        }
        return dropOff;
    }

    private List<CityCount> computeTopCities(List<ExpatsAnonymousSession> sessions, String field) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (ExpatsAnonymousSession session : sessions) {
            List<ExpatsAnonymousAnswer> answers = answerRepository.findBySessionIdOrderByStepNumberAsc(session.getId());
            for (ExpatsAnonymousAnswer answer : answers) {
                if ("city_selection".equals(answer.getQuestionKey())) {
                    String cityName = extractStringFromJsonNode(answer.getAnswerValue(), field);
                    if (cityName != null && !cityName.isBlank()) {
                        counts.merge(cityName.trim(), 1L, Long::sum);
                    }
                }
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(15)
                .map(e -> new CityCount(e.getKey(), e.getValue()))
                .toList();
    }

    private List<AnswerDistribution> computeAnswerDistributions(List<ExpatsAnonymousSession> sessions) {
        // Domande da tracciare
        List<String> questionKeys = List.of(
                "user_phase", "relocation_time", "age_range", "relationship",
                "motivation", "work_type", "need", "city_priority", "budget"
        );

        Map<String, Map<String, Long>> distributions = new LinkedHashMap<>();
        for (String key : questionKeys) {
            distributions.put(key, new LinkedHashMap<>());
        }

        for (ExpatsAnonymousSession session : sessions) {
            List<ExpatsAnonymousAnswer> answers = answerRepository.findBySessionIdOrderByStepNumberAsc(session.getId());
            for (ExpatsAnonymousAnswer answer : answers) {
                String qk = answer.getQuestionKey();
                if (distributions.containsKey(qk)) {
                    String val = extractAnswerAsString(answer.getAnswerValue());
                    if (val != null && !val.isBlank()) {
                        distributions.get(qk).merge(val, 1L, Long::sum);
                    }
                }
            }
        }

        return distributions.entrySet().stream()
                .filter(e -> !e.getValue().isEmpty())
                .map(e -> new AnswerDistribution(e.getKey(), e.getValue()))
                .toList();
    }

    private List<CityCount> computeWaitingListTop() {
        return waitingListRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCityName() != null ? e.getCityName().trim() : "unknown",
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(e -> new CityCount(e.getKey(), e.getValue()))
                .toList();
    }

    private String extractStringFromJsonNode(Object value, String field) {
        if (value instanceof Map<?, ?> map) {
            Object v = map.get(field);
            return v instanceof String s ? s : null;
        }
        if (value instanceof com.fasterxml.jackson.databind.JsonNode node && node.has(field)) {
            return node.get(field).asText(null);
        }
        return null;
    }

    private String extractAnswerAsString(Object value) {
        if (value instanceof String s) return s;
        if (value instanceof com.fasterxml.jackson.databind.JsonNode node) {
            if (node.isTextual()) return node.asText();
            if (node.isNumber()) return node.asText();
            if (node.isArray()) {
                List<String> items = new ArrayList<>();
                node.forEach(n -> { if (n.isTextual()) items.add(n.asText()); });
                return items.isEmpty() ? null : String.join(", ", items);
            }
        }
        return value != null ? value.toString() : null;
    }
}
