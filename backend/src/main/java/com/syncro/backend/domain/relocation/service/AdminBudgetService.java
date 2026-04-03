package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.relocation.dto.AdminBudgetSimulationResponse;
import com.syncro.backend.domain.relocation.dto.AdminBudgetStatsResponse;
import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.repository.BudgetSimulationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminBudgetService {

    private final BudgetSimulationRepository simulationRepository;

    public AdminBudgetService(BudgetSimulationRepository simulationRepository) {
        this.simulationRepository = simulationRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminBudgetSimulationResponse> getSimulations(String source, String planCode,
                                                                UUID cityId, Pageable pageable) {
        Page<BudgetSimulation> page;

        if ("anonymous".equals(source)) {
            page = simulationRepository.findByAnonymousSessionIsNotNullOrderByCreatedAtDesc(pageable);
        } else if ("registered".equals(source)) {
            page = simulationRepository.findByUserIsNotNullOrderByCreatedAtDesc(pageable);
        } else if (planCode != null && !planCode.isBlank()) {
            page = simulationRepository.findByPlanCodeOrderByCreatedAtDesc(planCode.toUpperCase(), pageable);
        } else if (cityId != null) {
            page = simulationRepository.findByCity_IdOrderByCreatedAtDesc(cityId, pageable);
        } else {
            page = simulationRepository.findByOrderByCreatedAtDesc(pageable);
        }

        return page.map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public AdminBudgetStatsResponse getStats() {
        long total = simulationRepository.count();
        long anonymous = simulationRepository.countByAnonymousSessionIsNotNull();
        long registered = simulationRepository.countByUserIsNotNull();
        long last24h = simulationRepository.countByCreatedAtAfter(Instant.now().minus(24, ChronoUnit.HOURS));

        List<Object[]> cityStats = simulationRepository.countByCity();
        String topCity = cityStats.isEmpty() ? null : (String) cityStats.get(0)[0];

        Map<String, Long> byPlan = simulationRepository.countByPlanCode().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1],
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        return new AdminBudgetStatsResponse(total, anonymous, registered, last24h, topCity, byPlan);
    }

    @SuppressWarnings("unchecked")
    private AdminBudgetSimulationResponse toAdminResponse(BudgetSimulation sim) {
        RelocationCityDataset city = sim.getCity();
        String source = sim.getUser() != null ? "registered" : "anonymous";

        String userEmail = null;
        UUID userId = null;
        if (sim.getUser() != null) {
            userId = sim.getUser().getId();
            userEmail = sim.getUser().getEmail();
        }

        UUID sessionId = sim.getAnonymousSession() != null ? sim.getAnonymousSession().getId() : null;

        Map<String, Object> output = sim.getOutputPayload() != null ? sim.getOutputPayload() : Map.of();
        BigDecimal monthlyCost = output.get("estimatedMonthlyCost") instanceof Number n
                ? BigDecimal.valueOf(n.doubleValue()) : null;
        BigDecimal monthlyBalance = output.get("monthlyBalance") instanceof Number n
                ? BigDecimal.valueOf(n.doubleValue()) : null;
        String balanceStatus = output.get("balanceStatus") instanceof String s ? s : null;

        return new AdminBudgetSimulationResponse(
                sim.getId(),
                source,
                userId,
                userEmail,
                sessionId,
                city != null ? city.getId() : null,
                city != null ? city.getCityName() : null,
                sim.getPlanCode(),
                monthlyCost,
                monthlyBalance,
                balanceStatus,
                sim.getInputPayload(),
                sim.getOutputPayload(),
                sim.getAlgorithmVersion(),
                sim.getCreatedAt()
        );
    }
}
