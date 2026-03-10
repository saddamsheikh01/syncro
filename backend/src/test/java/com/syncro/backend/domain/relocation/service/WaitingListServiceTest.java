package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.relocation.dto.CityDatasetSummaryResponse;
import com.syncro.backend.domain.relocation.dto.WaitingListRequest;
import com.syncro.backend.domain.relocation.dto.WaitingListResponse;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.entity.RelocationCityWaitingList;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityWaitingListRepository;
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
class WaitingListServiceTest {

    @Mock private RelocationCityWaitingListRepository waitingListRepository;
    @Mock private RelocationCityDatasetRepository cityRepository;
    @Mock private RelocationMapper mapper;

    @InjectMocks
    private WaitingListService service;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("joinWaitingList inserts entry and suggests similar cities")
    void joinWaitingList_success() {
        WaitingListRequest request = new WaitingListRequest("user@test.com", "Vienna");

        when(cityRepository.findByCitySlugAndActiveTrue("vienna")).thenReturn(Optional.empty());
        when(waitingListRepository.existsByEmailAndCityName("user@test.com", "Vienna")).thenReturn(false);
        when(waitingListRepository.save(any())).thenAnswer(inv -> {
            RelocationCityWaitingList e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });
        when(cityRepository.findByActiveTrueOrderByCityNameAsc()).thenReturn(List.of());
        when(mapper.toWaitingListResponse(any())).thenReturn(
                new WaitingListResponse(UUID.randomUUID(), "user@test.com", "Vienna", false, Instant.now())
        );

        Map<String, Object> result = service.joinWaitingList(request, testUser);

        assertThat(result).containsKey("waitingListEntry");
        assertThat(result).containsKey("message");
        assertThat(result).containsKey("suggestedCities");

        verify(waitingListRepository).save(argThat(entry ->
                entry.getEmail().equals("user@test.com") &&
                entry.getCityName().equals("Vienna") &&
                entry.getUser().equals(testUser)
        ));
    }

    @Test
    @DisplayName("joinWaitingList throws CONFLICT when city already in dataset")
    void joinWaitingList_cityExists_throwsConflict() {
        WaitingListRequest request = new WaitingListRequest("user@test.com", "Lisbon");

        RelocationCityDataset existingCity = new RelocationCityDataset();
        when(cityRepository.findByCitySlugAndActiveTrue("lisbon")).thenReturn(Optional.of(existingCity));

        assertThatThrownBy(() -> service.joinWaitingList(request, testUser))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("City already available in dataset");
    }

    @Test
    @DisplayName("joinWaitingList throws CONFLICT when email already waiting for same city")
    void joinWaitingList_duplicateEmail_throwsConflict() {
        WaitingListRequest request = new WaitingListRequest("user@test.com", "Vienna");

        when(cityRepository.findByCitySlugAndActiveTrue("vienna")).thenReturn(Optional.empty());
        when(waitingListRepository.existsByEmailAndCityName("user@test.com", "Vienna")).thenReturn(true);

        assertThatThrownBy(() -> service.joinWaitingList(request, testUser))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Already on the waiting list");
    }

    @Test
    @DisplayName("getWaitingListEntries returns only non-notified entries")
    void getWaitingListEntries_returnsNonNotified() {
        RelocationCityWaitingList entry = new RelocationCityWaitingList();
        entry.setId(UUID.randomUUID());
        entry.setEmail("user@test.com");
        entry.setCityName("Vienna");
        entry.setNotified(false);

        when(waitingListRepository.findByNotifiedFalseOrderByCreatedAtAsc()).thenReturn(List.of(entry));
        when(mapper.toWaitingListResponse(entry)).thenReturn(
                new WaitingListResponse(entry.getId(), "user@test.com", "Vienna", false, Instant.now())
        );

        List<WaitingListResponse> result = service.getWaitingListEntries();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).notified()).isFalse();
    }

    @Test
    @DisplayName("markAsNotified marks all entries for city as notified and returns count")
    void markAsNotified_marksAll() {
        RelocationCityWaitingList entry1 = new RelocationCityWaitingList();
        entry1.setNotified(false);
        RelocationCityWaitingList entry2 = new RelocationCityWaitingList();
        entry2.setNotified(false);

        when(waitingListRepository.findByCityNameAndNotifiedFalse("Vienna"))
                .thenReturn(List.of(entry1, entry2));

        int count = service.markAsNotified("Vienna");

        assertThat(count).isEqualTo(2);
        assertThat(entry1.getNotified()).isTrue();
        assertThat(entry2.getNotified()).isTrue();
        verify(waitingListRepository).saveAll(anyList());
    }
}
