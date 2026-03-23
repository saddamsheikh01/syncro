package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.BudgetTrackingResponse;
import com.syncro.backend.domain.relocation.dto.CreateBudgetTrackingRequest;
import com.syncro.backend.domain.relocation.entity.BudgetSimulation;
import com.syncro.backend.domain.relocation.entity.BudgetTrackingEntry;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.BudgetSimulationRepository;
import com.syncro.backend.domain.relocation.repository.BudgetTrackingEntryRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BudgetTrackingService {

    private final BudgetTrackingEntryRepository trackingRepository;
    private final BudgetSimulationRepository simulationRepository;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public BudgetTrackingService(BudgetTrackingEntryRepository trackingRepository,
                                  BudgetSimulationRepository simulationRepository,
                                  RelocationMapper mapper,
                                  AnalyticsService analyticsService,
                                  UserRepository userRepository) {
        this.trackingRepository = trackingRepository;
        this.simulationRepository = simulationRepository;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    @Transactional
    public BudgetTrackingResponse createEntry(UUID userId, CreateBudgetTrackingRequest request) {
        User user = userRepository.getReferenceById(userId);
        BudgetTrackingEntry entry = new BudgetTrackingEntry();
        entry.setUser(user);
        entry.setCategory(request.category());

        if (request.simulationId() != null) {
            BudgetSimulation sim = simulationRepository.findById(request.simulationId()).orElse(null);
            entry.setSimulation(sim);
        }

        BigDecimal expected = request.expectedValue() != null ? request.expectedValue() : BigDecimal.ZERO;
        BigDecimal actual = request.actualValue() != null ? request.actualValue() : BigDecimal.ZERO;
        BigDecimal delta = actual.subtract(expected);
        BigDecimal threshold = request.threshold() != null ? request.threshold() : BigDecimal.ZERO;

        entry.setExpectedValue(expected);
        entry.setActualValue(actual);
        entry.setDelta(delta);
        entry.setThreshold(threshold);

        String alertStatus = computeAlertStatus(delta, threshold);
        entry.setAlertStatus(alertStatus);

        entry = trackingRepository.save(entry);
        analyticsService.trackServerEventSafe(userId, "BUDGET_TRACKING_ENTRY_CREATED",
                Map.of("category", request.category(), "alertStatus", alertStatus));
        return mapper.toBudgetTrackingResponse(entry);
    }

    @Transactional(readOnly = true)
    public List<BudgetTrackingResponse> getEntries(UUID userId) {
        return trackingRepository.findByUser_IdOrderByRecordedAtDesc(userId)
                .stream()
                .map(mapper::toBudgetTrackingResponse)
                .collect(Collectors.toList());
    }

    private String computeAlertStatus(BigDecimal delta, BigDecimal threshold) {
        if (threshold.compareTo(BigDecimal.ZERO) == 0) {
            return "OK";
        }
        BigDecimal absDelta = delta.abs();
        if (absDelta.compareTo(threshold) > 0) {
            return delta.compareTo(BigDecimal.ZERO) > 0 ? "OVER_BUDGET" : "UNDER_BUDGET";
        }
        BigDecimal warningThreshold = threshold.multiply(new BigDecimal("0.8"));
        if (absDelta.compareTo(warningThreshold) > 0) {
            return "WARNING";
        }
        return "OK";
    }
}
