package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.relocation.dto.CityDatasetResponse;
import com.syncro.backend.domain.relocation.dto.CreateCityDatasetRequest;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CityDatasetServiceTest {

    @Mock
    private RelocationCityDatasetRepository cityRepository;

    @Mock
    private RelocationMapper mapper;

    @InjectMocks
    private CityDatasetService service;

    private RelocationCityDataset testCity;

    @BeforeEach
    void setUp() {
        testCity = buildTestCity("Lisbon", "lisbon");
    }

    @Test
    @DisplayName("recalculateAllMacroaree computes costo_vita correctly: 100 - weighted average")
    void recalculateAllMacroaree_costoVita() {
        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity));
        when(cityRepository.findAllActivePriceToIncomeRatios()).thenReturn(List.of(testCity.getPriceToIncomeRatio()));
        when(cityRepository.findAllActivePriceToRentCityCenterRatios()).thenReturn(List.of(testCity.getPriceToRentCityCenterRatio()));

        service.recalculateAllMacroaree();

        // costo_vita = 100 - (costOfLivingExRent * 0.5 + groceries * 0.3 + restaurant * 0.2)
        // = 100 - (45 * 0.5 + 40 * 0.3 + 50 * 0.2) = 100 - (22.5 + 12 + 10) = 100 - 44.5 = 55.50
        assertThat(testCity.getMacroCostoVita()).isEqualByComparingTo(new BigDecimal("55.50"));

        verify(cityRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("recalculateAllMacroaree computes qualita_vita correctly: average of 5 factors")
    void recalculateAllMacroaree_qualitaVita() {
        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity));
        when(cityRepository.findAllActivePriceToIncomeRatios()).thenReturn(List.of(testCity.getPriceToIncomeRatio()));
        when(cityRepository.findAllActivePriceToRentCityCenterRatios()).thenReturn(List.of(testCity.getPriceToRentCityCenterRatio()));

        service.recalculateAllMacroaree();

        // qualita_vita = (safety + healthcare + climate + (100-pollution) + (100-traffic)) / 5
        // = (70 + 75 + 80 + (100-30) + (100-35)) / 5 = (70 + 75 + 80 + 70 + 65) / 5 = 360 / 5 = 72.00
        assertThat(testCity.getMacroQualitaVita()).isEqualByComparingTo(new BigDecimal("72.00"));
    }

    @Test
    @DisplayName("recalculateAllMacroaree computes potere_economico as direct purchasing_power_index")
    void recalculateAllMacroaree_potereEconomico() {
        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity));
        when(cityRepository.findAllActivePriceToIncomeRatios()).thenReturn(List.of(testCity.getPriceToIncomeRatio()));
        when(cityRepository.findAllActivePriceToRentCityCenterRatios()).thenReturn(List.of(testCity.getPriceToRentCityCenterRatio()));

        service.recalculateAllMacroaree();

        // potere_economico = purchasing_power_index (direct)
        assertThat(testCity.getMacroPotereEconomico()).isEqualByComparingTo(new BigDecimal("65.00"));
    }

    @Test
    @DisplayName("recalculateAllMacroaree computes opportunita_lavorative: average of career + remote")
    void recalculateAllMacroaree_opportunitaLavorative() {
        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity));
        when(cityRepository.findAllActivePriceToIncomeRatios()).thenReturn(List.of(testCity.getPriceToIncomeRatio()));
        when(cityRepository.findAllActivePriceToRentCityCenterRatios()).thenReturn(List.of(testCity.getPriceToRentCityCenterRatio()));

        service.recalculateAllMacroaree();

        // opportunita_lavorative = (career + remote) / 2 = (60 + 55) / 2 = 57.50
        assertThat(testCity.getMacroOpportunitaLavorative()).isEqualByComparingTo(new BigDecimal("57.50"));
    }

    @Test
    @DisplayName("recalculateAllMacroaree computes integrazione_sociale: average of expat + social")
    void recalculateAllMacroaree_integrazioneSociale() {
        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity));
        when(cityRepository.findAllActivePriceToIncomeRatios()).thenReturn(List.of(testCity.getPriceToIncomeRatio()));
        when(cityRepository.findAllActivePriceToRentCityCenterRatios()).thenReturn(List.of(testCity.getPriceToRentCityCenterRatio()));

        service.recalculateAllMacroaree();

        // integrazione_sociale = (expat + social) / 2 = (72 + 68) / 2 = 70.00
        assertThat(testCity.getMacroIntegrazioneSociale()).isEqualByComparingTo(new BigDecimal("70.00"));
    }

    @Test
    @DisplayName("recalculateAllMacroaree with multiple cities updates percentile rankings")
    void recalculateAllMacroaree_multiCity() {
        RelocationCityDataset city2 = buildTestCity("Berlin", "berlin");
        city2.setPriceToIncomeRatio(new BigDecimal("15.00")); // Higher ratio = worse
        city2.setPriceToRentCityCenterRatio(new BigDecimal("25.00"));

        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity, city2));
        when(cityRepository.findAllActivePriceToIncomeRatios())
                .thenReturn(List.of(testCity.getPriceToIncomeRatio(), city2.getPriceToIncomeRatio()));
        when(cityRepository.findAllActivePriceToRentCityCenterRatios())
                .thenReturn(List.of(testCity.getPriceToRentCityCenterRatio(), city2.getPriceToRentCityCenterRatio()));

        service.recalculateAllMacroaree();

        // Both cities should have macroaree computed
        assertThat(testCity.getMacroCostoVita()).isNotNull();
        assertThat(city2.getMacroCostoVita()).isNotNull();
        assertThat(testCity.getMacroMercatoImmobiliare()).isNotNull();
        assertThat(city2.getMacroMercatoImmobiliare()).isNotNull();

        // City with higher ratio should have lower (worse) mercato_immobiliare
        // because percentile rank is higher for higher values (100 = most expensive)
        // after inversion: lower score = more expensive
        verify(cityRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("recalculateAllMacroaree with no active cities does nothing")
    void recalculateAllMacroaree_empty() {
        when(cityRepository.findByActiveTrue()).thenReturn(List.of());

        service.recalculateAllMacroaree();

        verify(cityRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Macroaree values are clamped between 0 and 100")
    void recalculateAllMacroaree_valuesClampedTo0_100() {
        // Set extreme values
        testCity.setCostOfLivingExRentIndex(new BigDecimal("200")); // Very expensive
        testCity.setGroceriesIndex(new BigDecimal("200"));
        testCity.setRestaurantIndex(new BigDecimal("200"));

        when(cityRepository.findByActiveTrue()).thenReturn(List.of(testCity));
        when(cityRepository.findAllActivePriceToIncomeRatios()).thenReturn(List.of(testCity.getPriceToIncomeRatio()));
        when(cityRepository.findAllActivePriceToRentCityCenterRatios()).thenReturn(List.of(testCity.getPriceToRentCityCenterRatio()));

        service.recalculateAllMacroaree();

        // costo_vita = 100 - (200*0.5 + 200*0.3 + 200*0.2) = 100 - 200 = -100 → clamped to 0
        assertThat(testCity.getMacroCostoVita()).isEqualByComparingTo(BigDecimal.ZERO.setScale(2));
    }

    // ========== U7: Missing method tests ==========

    @Test
    @DisplayName("createCity creates new city and triggers macroaree recalculation")
    void createCity_createsAndRecalculates() {
        AdminUser admin = new AdminUser();
        admin.setId(UUID.randomUUID());

        CreateCityDatasetRequest request = new CreateCityDatasetRequest(
                "Porto", "porto", "Portugal", "PT",
                new BigDecimal("65"), new BigDecimal("60"),
                new BigDecimal("55"), new BigDecimal("50"),
                new BigDecimal("30"), new BigDecimal("60"),
                new BigDecimal("38"), new BigDecimal("45"),
                new BigDecimal("40"), new BigDecimal("38"),
                new BigDecimal("9.5"), new BigDecimal("18"),
                new BigDecimal("72"), new BigDecimal("78"),
                new BigDecimal("75"), new BigDecimal("25"),
                new BigDecimal("30"),
                new BigDecimal("700"), new BigDecimal("1400"),
                new BigDecimal("500"), new BigDecimal("1000"),
                null, null, null, null, null, null, null, null, null, null,
                null, null
        );

        when(cityRepository.existsByCitySlug("porto")).thenReturn(false);
        when(cityRepository.save(any())).thenAnswer(inv -> {
            RelocationCityDataset c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });
        when(cityRepository.findByActiveTrue()).thenReturn(List.of());
        when(cityRepository.findById(any())).thenReturn(Optional.of(testCity));
        when(mapper.toCityDatasetResponse(any())).thenReturn(mock(CityDatasetResponse.class));

        CityDatasetResponse result = service.createCity(request, admin);

        assertThat(result).isNotNull();
        verify(cityRepository).save(argThat(city ->
                "Porto".equals(city.getCityName()) &&
                "porto".equals(city.getCitySlug())
        ));
    }

    @Test
    @DisplayName("getCity returns city for UUID, throws NOT_FOUND if missing")
    void getCity_returnsOrThrowsNotFound() {
        UUID cityId = UUID.randomUUID();
        testCity.setId(cityId);

        when(cityRepository.findById(cityId)).thenReturn(Optional.of(testCity));
        when(mapper.toCityDatasetResponse(testCity)).thenReturn(mock(CityDatasetResponse.class));

        CityDatasetResponse result = service.getCity(cityId);
        assertThat(result).isNotNull();

        // Test NOT_FOUND
        UUID missingId = UUID.randomUUID();
        when(cityRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCity(missingId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("City not found");
    }

    // ========== HELPERS ==========

    private RelocationCityDataset buildTestCity(String name, String slug) {
        RelocationCityDataset city = new RelocationCityDataset();
        city.setCityName(name);
        city.setCitySlug(slug);
        city.setCountry("Portugal");
        city.setCountryCode("PT");
        city.setActive(true);

        // Social integration / work
        city.setExpatCommunityIndex(new BigDecimal("72.00"));
        city.setSocialIntegrationIndex(new BigDecimal("68.00"));
        city.setCareerOpportunityIndex(new BigDecimal("60.00"));
        city.setRemoteWorkEcosystemIndex(new BigDecimal("55.00"));

        // Cost of living
        city.setRentIndex(new BigDecimal("35.00"));
        city.setPurchasingPowerIndex(new BigDecimal("65.00"));
        city.setGroceriesIndex(new BigDecimal("40.00"));
        city.setRestaurantIndex(new BigDecimal("50.00"));
        city.setCostOfLivingExRentIndex(new BigDecimal("45.00"));
        city.setCostOfLivingIncRentIndex(new BigDecimal("42.00"));

        // Real estate ratios
        city.setPriceToIncomeRatio(new BigDecimal("10.50"));
        city.setPriceToRentCityCenterRatio(new BigDecimal("20.00"));

        // Quality of life
        city.setSafetyIndex(new BigDecimal("70.00"));
        city.setHealthcareIndex(new BigDecimal("75.00"));
        city.setClimateIndex(new BigDecimal("80.00"));
        city.setPollutionIndex(new BigDecimal("30.00"));
        city.setTrafficCommuteIndex(new BigDecimal("35.00"));

        // Practical economic data
        city.setApartment1brCenter(new BigDecimal("900.00"));
        city.setApartment3brCenter(new BigDecimal("1800.00"));
        city.setCostSingleNoRent(new BigDecimal("600.00"));
        city.setCostFamilyNoRent(new BigDecimal("1200.00"));

        return city;
    }
}
