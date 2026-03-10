package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.relocation.dto.CreateWeightRuleRequest;
import com.syncro.backend.domain.relocation.dto.UpdateWeightRuleRequest;
import com.syncro.backend.domain.relocation.dto.WeightRuleResponse;
import com.syncro.backend.domain.relocation.entity.RelocationWeightRule;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationWeightRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeightRuleServiceTest {

    @Mock private RelocationWeightRuleRepository weightRuleRepository;
    @Mock private RelocationMapper mapper;

    @InjectMocks
    private WeightRuleService service;

    private RelocationWeightRule testRule;

    @BeforeEach
    void setUp() {
        testRule = new RelocationWeightRule();
        testRule.setId(UUID.randomUUID());
        testRule.setQuestionKey("life_state");
        testRule.setAnswerValue("planning_move");
        testRule.setWeightAdjustments(Map.of("costo_vita", 5, "mercato_immobiliare", 10));
        testRule.setActive(true);
    }

    @Test
    @DisplayName("listAll returns all weight rules")
    void listAll_returnsAll() {
        WeightRuleResponse response = new WeightRuleResponse(
                testRule.getId(), "life_state", "planning_move",
                Map.of("costo_vita", 5, "mercato_immobiliare", 10),
                true, Instant.now(), Instant.now()
        );

        when(weightRuleRepository.findAll()).thenReturn(List.of(testRule));
        when(mapper.toWeightRuleResponse(testRule)).thenReturn(response);

        List<WeightRuleResponse> result = service.listAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).questionKey()).isEqualTo("life_state");
    }

    @Test
    @DisplayName("getById returns rule for UUID")
    void getById_returnsRule() {
        UUID ruleId = testRule.getId();
        WeightRuleResponse expected = mock(WeightRuleResponse.class);

        when(weightRuleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
        when(mapper.toWeightRuleResponse(testRule)).thenReturn(expected);

        WeightRuleResponse result = service.getById(ruleId);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getById throws NOT_FOUND when rule doesn't exist")
    void getById_notFound() {
        UUID ruleId = UUID.randomUUID();
        when(weightRuleRepository.findById(ruleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(ruleId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Weight rule not found");
    }

    @Test
    @DisplayName("create creates new rule, throws CONFLICT if duplicate")
    void create_success_andConflictOnDuplicate() {
        CreateWeightRuleRequest request = new CreateWeightRuleRequest(
                "motivation", "career", Map.of("opportunita_lavorative", 15)
        );

        // First call: no duplicate
        when(weightRuleRepository.findByQuestionKeyAndAnswerValue("motivation", "career"))
                .thenReturn(Optional.empty());
        when(weightRuleRepository.save(any())).thenAnswer(inv -> {
            RelocationWeightRule r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });
        when(mapper.toWeightRuleResponse(any())).thenReturn(mock(WeightRuleResponse.class));

        WeightRuleResponse result = service.create(request);
        assertThat(result).isNotNull();

        verify(weightRuleRepository).save(argThat(rule ->
                rule.getQuestionKey().equals("motivation") &&
                rule.getAnswerValue().equals("career")
        ));

        // Now test duplicate
        reset(weightRuleRepository);
        when(weightRuleRepository.findByQuestionKeyAndAnswerValue("motivation", "career"))
                .thenReturn(Optional.of(testRule));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Weight rule already exists");
    }

    @Test
    @DisplayName("update partially updates weight adjustments and active flag")
    void update_partialUpdate() {
        UUID ruleId = testRule.getId();
        UpdateWeightRuleRequest request = new UpdateWeightRuleRequest(
                Map.of("costo_vita", 20), false
        );

        when(weightRuleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
        when(weightRuleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toWeightRuleResponse(any())).thenReturn(mock(WeightRuleResponse.class));

        service.update(ruleId, request);

        verify(weightRuleRepository).save(argThat(rule ->
                rule.getWeightAdjustments().get("costo_vita") == 20 &&
                !rule.getActive()
        ));
    }
}
