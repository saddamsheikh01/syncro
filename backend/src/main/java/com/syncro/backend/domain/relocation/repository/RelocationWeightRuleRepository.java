package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationWeightRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RelocationWeightRuleRepository extends JpaRepository<RelocationWeightRule, UUID> {

    List<RelocationWeightRule> findByActiveTrue();

    List<RelocationWeightRule> findByQuestionKeyAndActiveTrue(String questionKey);

    Optional<RelocationWeightRule> findByQuestionKeyAndAnswerValue(String questionKey, String answerValue);
}
