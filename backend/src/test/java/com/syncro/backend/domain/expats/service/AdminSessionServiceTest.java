package com.syncro.backend.domain.expats.service;

import com.syncro.backend.domain.expats.dto.AdminSessionResponse;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousAnswerRepository;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminSessionServiceTest {

    @Mock private ExpatsAnonymousSessionRepository sessionRepository;
    @Mock private ExpatsAnonymousAnswerRepository answerRepository;

    @InjectMocks
    private AdminSessionService service;

    private ExpatsAnonymousSession testSession;

    @BeforeEach
    void setUp() {
        testSession = new ExpatsAnonymousSession();
        testSession.setId(UUID.randomUUID());
        testSession.setSessionToken("test-token");
        testSession.setStatus("COMPLETED");
        testSession.setUserType("planning_move");
        testSession.setCurrentStep(10);
        testSession.setTotalSteps(10);
        testSession.setExpiresAt(Instant.now().plusSeconds(86400));
        testSession.setLastSeenAt(Instant.now());
        testSession.setCreatedAt(Instant.now());
        testSession.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("listSessions senza filtro ritorna tutte le sessioni paginate")
    void listSessions_noFilter_returnsAll() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<ExpatsAnonymousSession> page = new PageImpl<>(List.of(testSession), pageable, 1);

        when(sessionRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);
        when(answerRepository.findBySessionIdOrderByStepNumberAsc(testSession.getId())).thenReturn(List.of());

        Page<AdminSessionResponse> result = service.listSessions(null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().id()).isEqualTo(testSession.getId());
        assertThat(result.getContent().getFirst().status()).isEqualTo("COMPLETED");
        assertThat(result.getContent().getFirst().converted()).isFalse();
    }

    @Test
    @DisplayName("listSessions con filtro status ritorna sessioni filtrate")
    void listSessions_withStatusFilter_returnsFiltered() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<ExpatsAnonymousSession> page = new PageImpl<>(List.of(testSession), pageable, 1);

        when(sessionRepository.findByStatusOrderByCreatedAtDesc("COMPLETED", pageable)).thenReturn(page);
        when(answerRepository.findBySessionIdOrderByStepNumberAsc(testSession.getId())).thenReturn(List.of());

        Page<AdminSessionResponse> result = service.listSessions("COMPLETED", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("getSession ritorna sessione con risposte")
    void getSession_returnsWithAnswers() {
        ExpatsAnonymousAnswer answer = new ExpatsAnonymousAnswer();
        answer.setId(UUID.randomUUID());
        answer.setQuestionKey("user_phase");
        answer.setQuestionGroup("CITY_FIT");
        answer.setStepNumber(1);
        answer.setAnswerValue("planning_move");
        answer.setVersion(1);
        answer.setAnsweredAt(Instant.now());

        when(sessionRepository.findById(testSession.getId())).thenReturn(Optional.of(testSession));
        when(answerRepository.findBySessionIdOrderByStepNumberAsc(testSession.getId())).thenReturn(List.of(answer));

        AdminSessionResponse result = service.getSession(testSession.getId());

        assertThat(result.id()).isEqualTo(testSession.getId());
        assertThat(result.answers()).hasSize(1);
        assertThat(result.answers().getFirst().questionKey()).isEqualTo("user_phase");
        assertThat(result.answers().getFirst().answerValue()).isNotNull();
    }

    @Test
    @DisplayName("getSession con sessione inesistente lancia NOT_FOUND")
    void getSession_notFound_throwsNotFound() {
        UUID fakeId = UUID.randomUUID();
        when(sessionRepository.findById(fakeId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSession(fakeId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Session not found");
    }
}
