package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.relocation.repository.UserSubscriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionService {

    private static final List<String> PLAN_HIERARCHY = List.of("FREE", "PREMIUM", "SUPER_PRO");

    private final UserSubscriptionRepository subscriptionRepository;

    public SubscriptionService(UserSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public String getUserPlan(UUID userId) {
        return subscriptionRepository.findFirstByUser_IdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE")
                .map(sub -> sub.getPlanCode().toUpperCase())
                .orElse("FREE");
    }

    public boolean hasAccess(UUID userId, String requiredPlan) {
        String userPlan = getUserPlan(userId);
        int userLevel = PLAN_HIERARCHY.indexOf(userPlan);
        int requiredLevel = PLAN_HIERARCHY.indexOf(requiredPlan.toUpperCase());
        return userLevel >= requiredLevel;
    }
}
