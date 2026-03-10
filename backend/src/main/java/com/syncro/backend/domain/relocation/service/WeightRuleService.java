package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.relocation.dto.CreateWeightRuleRequest;
import com.syncro.backend.domain.relocation.dto.UpdateWeightRuleRequest;
import com.syncro.backend.domain.relocation.dto.WeightRuleResponse;
import com.syncro.backend.domain.relocation.entity.RelocationWeightRule;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationWeightRuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class WeightRuleService {

    private final RelocationWeightRuleRepository weightRuleRepository;
    private final RelocationMapper mapper;

    public WeightRuleService(RelocationWeightRuleRepository weightRuleRepository,
                             RelocationMapper mapper) {
        this.weightRuleRepository = weightRuleRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<WeightRuleResponse> listAll() {
        return weightRuleRepository.findAll()
                .stream()
                .map(mapper::toWeightRuleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WeightRuleResponse getById(UUID ruleId) {
        RelocationWeightRule rule = weightRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Weight rule not found"));
        return mapper.toWeightRuleResponse(rule);
    }

    @Transactional
    public WeightRuleResponse create(CreateWeightRuleRequest request) {
        if (weightRuleRepository.findByQuestionKeyAndAnswerValue(request.questionKey(), request.answerValue()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Weight rule already exists for " + request.questionKey() + "/" + request.answerValue());
        }

        RelocationWeightRule rule = new RelocationWeightRule();
        rule.setQuestionKey(request.questionKey());
        rule.setAnswerValue(request.answerValue());
        rule.setWeightAdjustments(request.weightAdjustments());

        rule = weightRuleRepository.save(rule);
        return mapper.toWeightRuleResponse(rule);
    }

    @Transactional
    public WeightRuleResponse update(UUID ruleId, UpdateWeightRuleRequest request) {
        RelocationWeightRule rule = weightRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Weight rule not found"));

        if (request.weightAdjustments() != null) rule.setWeightAdjustments(request.weightAdjustments());
        if (request.active() != null) rule.setActive(request.active());

        rule = weightRuleRepository.save(rule);
        return mapper.toWeightRuleResponse(rule);
    }
}
