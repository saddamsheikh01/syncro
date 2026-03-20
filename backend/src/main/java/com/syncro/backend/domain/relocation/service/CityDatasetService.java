package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.RelocationCityDatasetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class CityDatasetService {

    private static final Logger log = LoggerFactory.getLogger(CityDatasetService.class);

    private final RelocationCityDatasetRepository cityRepository;
    private final RelocationMapper mapper;

    public CityDatasetService(RelocationCityDatasetRepository cityRepository,
                              RelocationMapper mapper) {
        this.cityRepository = cityRepository;
        this.mapper = mapper;
    }

    /**
     * On application startup, recalculate macroaree for any city that has NULL values.
     * This handles the case where cities were inserted directly via SQL without going through the admin API.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void recalculateMacroareeOnStartupIfNeeded() {
        List<RelocationCityDataset> activeCities = cityRepository.findByActiveTrue();
        boolean hasNullMacroaree = activeCities.stream().anyMatch(c ->
                c.getMacroCostoVita() == null || c.getMacroQualitaVita() == null);
        if (hasNullMacroaree) {
            log.info("Found cities with NULL macroaree — recalculating for {} active cities", activeCities.size());
            recalculateAllMacroaree();
        }
    }

    @Transactional(readOnly = true)
    public List<CityDatasetSummaryResponse> listActiveCities() {
        return cityRepository.findByActiveTrueOrderByCityNameAsc()
                .stream()
                .map(mapper::toCityDatasetSummaryResponse)
                .toList();
    }

    /**
     * Lists ALL cities (active + inactive) for admin backoffice.
     */
    @Transactional(readOnly = true)
    public List<CityDatasetResponse> listAllCities() {
        return cityRepository.findAll()
                .stream()
                .map(mapper::toCityDatasetResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CityDatasetResponse getCity(UUID cityId) {
        RelocationCityDataset city = findCityOrThrow(cityId);
        return mapper.toCityDatasetResponse(city);
    }

    @Transactional(readOnly = true)
    public CityDatasetResponse getCityBySlug(String slug) {
        RelocationCityDataset city = cityRepository.findByCitySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "City not found: " + slug));
        return mapper.toCityDatasetResponse(city);
    }

    @Transactional
    public CityDatasetResponse createCity(CreateCityDatasetRequest request, AdminUser admin) {
        if (cityRepository.existsByCitySlug(request.citySlug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "City slug already exists: " + request.citySlug());
        }

        RelocationCityDataset city = new RelocationCityDataset();
        applyCreateFields(city, request);
        city.setCreatedBy(admin);
        city.setUpdatedBy(admin);

        city = cityRepository.save(city);

        // Recalculate macroaree for ALL active cities (percentile rankings change)
        recalculateAllMacroaree();

        // Refetch to return updated macroaree
        city = findCityOrThrow(city.getId());
        return mapper.toCityDatasetResponse(city);
    }

    @Transactional
    public CityDatasetResponse updateCity(UUID cityId, UpdateCityDatasetRequest request, AdminUser admin) {
        RelocationCityDataset city = findCityOrThrow(cityId);
        applyUpdateFields(city, request);
        city.setUpdatedBy(admin);

        city = cityRepository.save(city);

        // Recalculate macroaree for ALL active cities (percentile rankings change)
        recalculateAllMacroaree();

        // Refetch to return updated macroaree
        city = findCityOrThrow(city.getId());
        return mapper.toCityDatasetResponse(city);
    }

    /**
     * Recalculates the 6 macroaree for ALL active cities.
     * Must be called whenever any city data changes because percentile
     * rankings for real estate ratios are relative to the whole dataset.
     */
    @Transactional
    public void recalculateAllMacroaree() {
        List<RelocationCityDataset> activeCities = cityRepository.findByActiveTrue();
        if (activeCities.isEmpty()) return;

        // Collect all price_to_income and price_to_rent values for percentile calculation
        List<BigDecimal> allPriceToIncome = cityRepository.findAllActivePriceToIncomeRatios();
        List<BigDecimal> allPriceToRentCenter = cityRepository.findAllActivePriceToRentCityCenterRatios();

        for (RelocationCityDataset city : activeCities) {
            computeMacroaree(city, allPriceToIncome, allPriceToRentCenter);
        }

        cityRepository.saveAll(activeCities);
    }

    /**
     * Computes the 6 macroaree for a single city using the explicit formulas from the PDF specifications.
     *
     * Level B formulas:
     * 1. costo_vita = 100 - (cost_of_living_ex_rent * 0.5 + groceries * 0.3 + restaurant * 0.2)
     * 2. mercato_immobiliare = 100 - (rent_index * 0.35 + cost_of_living_inc_rent * 0.25
     *    + percentile_rank(price_to_income) * 0.20 + percentile_rank(price_to_rent_center) * 0.20)
     * 3. potere_economico = purchasing_power_index (direct)
     * 4. qualita_vita = (safety + healthcare + climate + (100-pollution) + (100-traffic)) / 5
     * 5. opportunita_lavorative = (career_opportunity + remote_work_ecosystem) / 2
     * 6. integrazione_sociale = (expat_community + social_integration) / 2
     */
    private void computeMacroaree(RelocationCityDataset city,
                                   List<BigDecimal> allPriceToIncome,
                                   List<BigDecimal> allPriceToRentCenter) {

        // 1. costo_vita (inverted: 100 = cheapest)
        BigDecimal rawCostoVita = city.getCostOfLivingExRentIndex().multiply(bd("0.50"))
                .add(city.getGroceriesIndex().multiply(bd("0.30")))
                .add(city.getRestaurantIndex().multiply(bd("0.20")));
        city.setMacroCostoVita(clamp(bd("100").subtract(rawCostoVita)));

        // 2. mercato_immobiliare (inverted: 100 = most affordable)
        BigDecimal ptiPercentile = percentileRank(city.getPriceToIncomeRatio(), allPriceToIncome);
        BigDecimal ptrPercentile = percentileRank(city.getPriceToRentCityCenterRatio(), allPriceToRentCenter);

        BigDecimal rawMercato = city.getRentIndex().multiply(bd("0.35"))
                .add(city.getCostOfLivingIncRentIndex().multiply(bd("0.25")))
                .add(ptiPercentile.multiply(bd("0.20")))
                .add(ptrPercentile.multiply(bd("0.20")));
        city.setMacroMercatoImmobiliare(clamp(bd("100").subtract(rawMercato)));

        // 3. potere_economico (direct)
        city.setMacroPotereEconomico(clamp(city.getPurchasingPowerIndex()));

        // 4. qualita_vita
        BigDecimal qualita = city.getSafetyIndex()
                .add(city.getHealthcareIndex())
                .add(city.getClimateIndex())
                .add(bd("100").subtract(city.getPollutionIndex()))
                .add(bd("100").subtract(city.getTrafficCommuteIndex()))
                .divide(bd("5"), 2, RoundingMode.HALF_UP);
        city.setMacroQualitaVita(clamp(qualita));

        // 5. opportunita_lavorative
        BigDecimal opportunita = city.getCareerOpportunityIndex()
                .add(city.getRemoteWorkEcosystemIndex())
                .divide(bd("2"), 2, RoundingMode.HALF_UP);
        city.setMacroOpportunitaLavorative(clamp(opportunita));

        // 6. integrazione_sociale
        BigDecimal integrazione = city.getExpatCommunityIndex()
                .add(city.getSocialIntegrationIndex())
                .divide(bd("2"), 2, RoundingMode.HALF_UP);
        city.setMacroIntegrazioneSociale(clamp(integrazione));
    }

    /**
     * Calculates percentile rank of a value within a sorted list.
     * Returns a score 0-100 where 100 = highest ratio (worst for real estate).
     */
    private BigDecimal percentileRank(BigDecimal value, List<BigDecimal> sortedValues) {
        if (sortedValues.isEmpty() || sortedValues.size() == 1) {
            return bd("50"); // Default to median if only one city
        }

        long countBelow = sortedValues.stream()
                .filter(v -> v.compareTo(value) < 0)
                .count();

        return BigDecimal.valueOf(countBelow)
                .multiply(bd("100"))
                .divide(BigDecimal.valueOf(sortedValues.size() - 1), 2, RoundingMode.HALF_UP);
    }

    /**
     * Clamps a value between 0 and 100.
     */
    private BigDecimal clamp(BigDecimal value) {
        if (value.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (value.compareTo(bd("100")) > 0) return bd("100");
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private void applyCreateFields(RelocationCityDataset city, CreateCityDatasetRequest r) {
        city.setCityName(r.cityName());
        city.setCitySlug(r.citySlug());
        city.setCountry(r.country());
        city.setCountryCode(r.countryCode());
        city.setExpatCommunityIndex(r.expatCommunityIndex());
        city.setSocialIntegrationIndex(r.socialIntegrationIndex());
        city.setCareerOpportunityIndex(r.careerOpportunityIndex());
        city.setRemoteWorkEcosystemIndex(r.remoteWorkEcosystemIndex());
        city.setRentIndex(r.rentIndex());
        city.setPurchasingPowerIndex(r.purchasingPowerIndex());
        city.setGroceriesIndex(r.groceriesIndex());
        city.setRestaurantIndex(r.restaurantIndex());
        city.setCostOfLivingExRentIndex(r.costOfLivingExRentIndex());
        city.setCostOfLivingIncRentIndex(r.costOfLivingIncRentIndex());
        city.setPriceToIncomeRatio(r.priceToIncomeRatio());
        city.setPriceToRentCityCenterRatio(r.priceToRentCityCenterRatio());
        city.setSafetyIndex(r.safetyIndex());
        city.setHealthcareIndex(r.healthcareIndex());
        city.setClimateIndex(r.climateIndex());
        city.setPollutionIndex(r.pollutionIndex());
        city.setTrafficCommuteIndex(r.trafficCommuteIndex());
        city.setApartment1brCenter(r.apartment1brCenter());
        city.setApartment3brCenter(r.apartment3brCenter());
        city.setCostSingleNoRent(r.costSingleNoRent());
        city.setCostFamilyNoRent(r.costFamilyNoRent());
        city.setDistricts(r.districts());
    }

    private void applyUpdateFields(RelocationCityDataset city, UpdateCityDatasetRequest r) {
        if (r.cityName() != null) city.setCityName(r.cityName());
        if (r.country() != null) city.setCountry(r.country());
        if (r.countryCode() != null) city.setCountryCode(r.countryCode());
        if (r.expatCommunityIndex() != null) city.setExpatCommunityIndex(r.expatCommunityIndex());
        if (r.socialIntegrationIndex() != null) city.setSocialIntegrationIndex(r.socialIntegrationIndex());
        if (r.careerOpportunityIndex() != null) city.setCareerOpportunityIndex(r.careerOpportunityIndex());
        if (r.remoteWorkEcosystemIndex() != null) city.setRemoteWorkEcosystemIndex(r.remoteWorkEcosystemIndex());
        if (r.rentIndex() != null) city.setRentIndex(r.rentIndex());
        if (r.purchasingPowerIndex() != null) city.setPurchasingPowerIndex(r.purchasingPowerIndex());
        if (r.groceriesIndex() != null) city.setGroceriesIndex(r.groceriesIndex());
        if (r.restaurantIndex() != null) city.setRestaurantIndex(r.restaurantIndex());
        if (r.costOfLivingExRentIndex() != null) city.setCostOfLivingExRentIndex(r.costOfLivingExRentIndex());
        if (r.costOfLivingIncRentIndex() != null) city.setCostOfLivingIncRentIndex(r.costOfLivingIncRentIndex());
        if (r.priceToIncomeRatio() != null) city.setPriceToIncomeRatio(r.priceToIncomeRatio());
        if (r.priceToRentCityCenterRatio() != null) city.setPriceToRentCityCenterRatio(r.priceToRentCityCenterRatio());
        if (r.safetyIndex() != null) city.setSafetyIndex(r.safetyIndex());
        if (r.healthcareIndex() != null) city.setHealthcareIndex(r.healthcareIndex());
        if (r.climateIndex() != null) city.setClimateIndex(r.climateIndex());
        if (r.pollutionIndex() != null) city.setPollutionIndex(r.pollutionIndex());
        if (r.trafficCommuteIndex() != null) city.setTrafficCommuteIndex(r.trafficCommuteIndex());
        if (r.apartment1brCenter() != null) city.setApartment1brCenter(r.apartment1brCenter());
        if (r.apartment3brCenter() != null) city.setApartment3brCenter(r.apartment3brCenter());
        if (r.costSingleNoRent() != null) city.setCostSingleNoRent(r.costSingleNoRent());
        if (r.costFamilyNoRent() != null) city.setCostFamilyNoRent(r.costFamilyNoRent());
        if (r.districts() != null) city.setDistricts(r.districts());
        if (r.active() != null) city.setActive(r.active());
    }

    private RelocationCityDataset findCityOrThrow(UUID cityId) {
        return cityRepository.findById(cityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "City not found"));
    }

    private static BigDecimal bd(String val) {
        return new BigDecimal(val);
    }
}
