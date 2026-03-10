package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.relocation.dto.CityDatasetSummaryResponse;
import com.syncro.backend.domain.relocation.dto.WaitingListRequest;
import com.syncro.backend.domain.relocation.dto.WaitingListResponse;
import com.syncro.backend.domain.relocation.entity.RelocationCityWaitingList;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import com.syncro.backend.domain.relocation.repository.RelocationCityWaitingListRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class WaitingListService {

    private final RelocationCityWaitingListRepository waitingListRepository;
    private final RelocationCityDatasetRepository cityRepository;
    private final RelocationMapper mapper;

    public WaitingListService(RelocationCityWaitingListRepository waitingListRepository,
                              RelocationCityDatasetRepository cityRepository,
                              RelocationMapper mapper) {
        this.waitingListRepository = waitingListRepository;
        this.cityRepository = cityRepository;
        this.mapper = mapper;
    }

    @Transactional
    public Map<String, Object> joinWaitingList(WaitingListRequest request, User user) {
        // Check if city already exists in dataset
        String slug = request.cityName().toLowerCase().replaceAll("\\s+", "-");
        boolean cityExists = cityRepository.findByCitySlugAndActiveTrue(slug).isPresent();
        if (cityExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "City already available in dataset: " + request.cityName());
        }

        // Check duplicate
        if (waitingListRepository.existsByEmailAndCityName(request.email(), request.cityName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Already on the waiting list for " + request.cityName());
        }

        RelocationCityWaitingList entry = new RelocationCityWaitingList();
        entry.setEmail(request.email());
        entry.setCityName(request.cityName());
        if (user != null) entry.setUser(user);

        entry = waitingListRepository.save(entry);

        // Suggest similar available cities
        List<CityDatasetSummaryResponse> suggestions = cityRepository.findByActiveTrueOrderByCityNameAsc()
                .stream()
                .limit(5)
                .map(mapper::toCityDatasetSummaryResponse)
                .toList();

        WaitingListResponse response = mapper.toWaitingListResponse(entry);
        return Map.of(
                "waitingListEntry", response,
                "message", "You've been added to the waiting list for " + request.cityName() + ". We'll notify you when it becomes available.",
                "suggestedCities", suggestions
        );
    }

    @Transactional(readOnly = true)
    public List<WaitingListResponse> getWaitingListEntries() {
        return waitingListRepository.findByNotifiedFalseOrderByCreatedAtAsc()
                .stream()
                .map(mapper::toWaitingListResponse)
                .toList();
    }

    /**
     * Marks all waiting list entries for a given city as notified.
     * Called by admin when a city is added to the dataset.
     */
    @Transactional
    public int markAsNotified(String cityName) {
        List<RelocationCityWaitingList> entries = waitingListRepository.findByCityNameAndNotifiedFalse(cityName);
        for (RelocationCityWaitingList entry : entries) {
            entry.setNotified(true);
        }
        waitingListRepository.saveAll(entries);
        return entries.size();
    }

    /**
     * Returns count of people waiting for a specific city.
     */
    @Transactional(readOnly = true)
    public long countWaitingForCity(String cityName) {
        return waitingListRepository.findByCityNameAndNotifiedFalse(cityName).size();
    }
}
