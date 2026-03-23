package com.syncro.backend.domain.relocation.entity;

import com.syncro.backend.domain.auth.entity.AdminUser;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "relocation_city_dataset")
public class RelocationCityDataset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "city_name", nullable = false, length = 255)
    private String cityName;

    @Column(name = "city_slug", nullable = false, unique = true, length = 255)
    private String citySlug;

    @Column(name = "country", nullable = false, length = 100)
    private String country;

    @Column(name = "country_code", nullable = false, length = 5)
    private String countryCode;

    // Social integration / work (scale 0-100)
    @Column(name = "expat_community_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal expatCommunityIndex;

    @Column(name = "social_integration_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal socialIntegrationIndex;

    @Column(name = "career_opportunity_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal careerOpportunityIndex;

    @Column(name = "remote_work_ecosystem_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal remoteWorkEcosystemIndex;

    // Cost of living (scale 0-100)
    @Column(name = "rent_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal rentIndex;

    @Column(name = "purchasing_power_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal purchasingPowerIndex;

    @Column(name = "groceries_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal groceriesIndex;

    @Column(name = "restaurant_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal restaurantIndex;

    @Column(name = "cost_of_living_ex_rent_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal costOfLivingExRentIndex;

    @Column(name = "cost_of_living_inc_rent_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal costOfLivingIncRentIndex;

    // Real estate ratios (raw numeric)
    @Column(name = "price_to_income_ratio", nullable = false, precision = 8, scale = 2)
    private BigDecimal priceToIncomeRatio;

    @Column(name = "price_to_rent_city_center_ratio", nullable = false, precision = 8, scale = 2)
    private BigDecimal priceToRentCityCenterRatio;

    // Quality of life (scale 0-100)
    @Column(name = "safety_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal safetyIndex;

    @Column(name = "healthcare_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal healthcareIndex;

    @Column(name = "climate_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal climateIndex;

    @Column(name = "pollution_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal pollutionIndex;

    @Column(name = "traffic_commute_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal trafficCommuteIndex;

    // Practical economic data (EUR)
    @Column(name = "apartment_1br_center", nullable = false, precision = 10, scale = 2)
    private BigDecimal apartment1brCenter;

    @Column(name = "apartment_3br_center", nullable = false, precision = 10, scale = 2)
    private BigDecimal apartment3brCenter;

    @Column(name = "cost_single_no_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal costSingleNoRent;

    @Column(name = "cost_family_no_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal costFamilyNoRent;

    // 6 calculated macroaree (Level B)
    @Column(name = "macro_costo_vita", precision = 5, scale = 2)
    private BigDecimal macroCostoVita;

    @Column(name = "macro_mercato_immobiliare", precision = 5, scale = 2)
    private BigDecimal macroMercatoImmobiliare;

    @Column(name = "macro_potere_economico", precision = 5, scale = 2)
    private BigDecimal macroPotereEconomico;

    @Column(name = "macro_qualita_vita", precision = 5, scale = 2)
    private BigDecimal macroQualitaVita;

    @Column(name = "macro_opportunita_lavorative", precision = 5, scale = 2)
    private BigDecimal macroOpportunitaLavorative;

    @Column(name = "macro_integrazione_sociale", precision = 5, scale = 2)
    private BigDecimal macroIntegrazioneSociale;

    // Extended cost data (Sprint 2 - Budget Simulator)
    @Column(name = "apartment_1br_outside", precision = 10, scale = 2)
    private BigDecimal apartment1brOutside;

    @Column(name = "apartment_3br_outside", precision = 10, scale = 2)
    private BigDecimal apartment3brOutside;

    @Column(name = "utilities_monthly", precision = 10, scale = 2)
    private BigDecimal utilitiesMonthly;

    @Column(name = "mobile_plan_monthly", precision = 10, scale = 2)
    private BigDecimal mobilePlanMonthly;

    @Column(name = "internet_monthly", precision = 10, scale = 2)
    private BigDecimal internetMonthly;

    @Column(name = "meal_for_two_midrange", precision = 10, scale = 2)
    private BigDecimal mealForTwoMidrange;

    @Column(name = "gasoline_per_liter", precision = 10, scale = 2)
    private BigDecimal gasolinePerLiter;

    @Column(name = "public_transport_monthly", precision = 10, scale = 2)
    private BigDecimal publicTransportMonthly;

    @Column(name = "preschool_monthly", precision = 10, scale = 2)
    private BigDecimal preschoolMonthly;

    @Column(name = "international_school_annual", precision = 10, scale = 2)
    private BigDecimal internationalSchoolAnnual;

    // Districts, image and metadata
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "districts", columnDefinition = "jsonb")
    private List<Map<String, String>> districts;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private AdminUser updatedBy;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (active == null) active = true;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }

    public String getCitySlug() { return citySlug; }
    public void setCitySlug(String citySlug) { this.citySlug = citySlug; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public BigDecimal getExpatCommunityIndex() { return expatCommunityIndex; }
    public void setExpatCommunityIndex(BigDecimal expatCommunityIndex) { this.expatCommunityIndex = expatCommunityIndex; }

    public BigDecimal getSocialIntegrationIndex() { return socialIntegrationIndex; }
    public void setSocialIntegrationIndex(BigDecimal socialIntegrationIndex) { this.socialIntegrationIndex = socialIntegrationIndex; }

    public BigDecimal getCareerOpportunityIndex() { return careerOpportunityIndex; }
    public void setCareerOpportunityIndex(BigDecimal careerOpportunityIndex) { this.careerOpportunityIndex = careerOpportunityIndex; }

    public BigDecimal getRemoteWorkEcosystemIndex() { return remoteWorkEcosystemIndex; }
    public void setRemoteWorkEcosystemIndex(BigDecimal remoteWorkEcosystemIndex) { this.remoteWorkEcosystemIndex = remoteWorkEcosystemIndex; }

    public BigDecimal getRentIndex() { return rentIndex; }
    public void setRentIndex(BigDecimal rentIndex) { this.rentIndex = rentIndex; }

    public BigDecimal getPurchasingPowerIndex() { return purchasingPowerIndex; }
    public void setPurchasingPowerIndex(BigDecimal purchasingPowerIndex) { this.purchasingPowerIndex = purchasingPowerIndex; }

    public BigDecimal getGroceriesIndex() { return groceriesIndex; }
    public void setGroceriesIndex(BigDecimal groceriesIndex) { this.groceriesIndex = groceriesIndex; }

    public BigDecimal getRestaurantIndex() { return restaurantIndex; }
    public void setRestaurantIndex(BigDecimal restaurantIndex) { this.restaurantIndex = restaurantIndex; }

    public BigDecimal getCostOfLivingExRentIndex() { return costOfLivingExRentIndex; }
    public void setCostOfLivingExRentIndex(BigDecimal costOfLivingExRentIndex) { this.costOfLivingExRentIndex = costOfLivingExRentIndex; }

    public BigDecimal getCostOfLivingIncRentIndex() { return costOfLivingIncRentIndex; }
    public void setCostOfLivingIncRentIndex(BigDecimal costOfLivingIncRentIndex) { this.costOfLivingIncRentIndex = costOfLivingIncRentIndex; }

    public BigDecimal getPriceToIncomeRatio() { return priceToIncomeRatio; }
    public void setPriceToIncomeRatio(BigDecimal priceToIncomeRatio) { this.priceToIncomeRatio = priceToIncomeRatio; }

    public BigDecimal getPriceToRentCityCenterRatio() { return priceToRentCityCenterRatio; }
    public void setPriceToRentCityCenterRatio(BigDecimal priceToRentCityCenterRatio) { this.priceToRentCityCenterRatio = priceToRentCityCenterRatio; }

    public BigDecimal getSafetyIndex() { return safetyIndex; }
    public void setSafetyIndex(BigDecimal safetyIndex) { this.safetyIndex = safetyIndex; }

    public BigDecimal getHealthcareIndex() { return healthcareIndex; }
    public void setHealthcareIndex(BigDecimal healthcareIndex) { this.healthcareIndex = healthcareIndex; }

    public BigDecimal getClimateIndex() { return climateIndex; }
    public void setClimateIndex(BigDecimal climateIndex) { this.climateIndex = climateIndex; }

    public BigDecimal getPollutionIndex() { return pollutionIndex; }
    public void setPollutionIndex(BigDecimal pollutionIndex) { this.pollutionIndex = pollutionIndex; }

    public BigDecimal getTrafficCommuteIndex() { return trafficCommuteIndex; }
    public void setTrafficCommuteIndex(BigDecimal trafficCommuteIndex) { this.trafficCommuteIndex = trafficCommuteIndex; }

    public BigDecimal getApartment1brCenter() { return apartment1brCenter; }
    public void setApartment1brCenter(BigDecimal apartment1brCenter) { this.apartment1brCenter = apartment1brCenter; }

    public BigDecimal getApartment3brCenter() { return apartment3brCenter; }
    public void setApartment3brCenter(BigDecimal apartment3brCenter) { this.apartment3brCenter = apartment3brCenter; }

    public BigDecimal getCostSingleNoRent() { return costSingleNoRent; }
    public void setCostSingleNoRent(BigDecimal costSingleNoRent) { this.costSingleNoRent = costSingleNoRent; }

    public BigDecimal getCostFamilyNoRent() { return costFamilyNoRent; }
    public void setCostFamilyNoRent(BigDecimal costFamilyNoRent) { this.costFamilyNoRent = costFamilyNoRent; }

    public BigDecimal getMacroCostoVita() { return macroCostoVita; }
    public void setMacroCostoVita(BigDecimal macroCostoVita) { this.macroCostoVita = macroCostoVita; }

    public BigDecimal getMacroMercatoImmobiliare() { return macroMercatoImmobiliare; }
    public void setMacroMercatoImmobiliare(BigDecimal macroMercatoImmobiliare) { this.macroMercatoImmobiliare = macroMercatoImmobiliare; }

    public BigDecimal getMacroPotereEconomico() { return macroPotereEconomico; }
    public void setMacroPotereEconomico(BigDecimal macroPotereEconomico) { this.macroPotereEconomico = macroPotereEconomico; }

    public BigDecimal getMacroQualitaVita() { return macroQualitaVita; }
    public void setMacroQualitaVita(BigDecimal macroQualitaVita) { this.macroQualitaVita = macroQualitaVita; }

    public BigDecimal getMacroOpportunitaLavorative() { return macroOpportunitaLavorative; }
    public void setMacroOpportunitaLavorative(BigDecimal macroOpportunitaLavorative) { this.macroOpportunitaLavorative = macroOpportunitaLavorative; }

    public BigDecimal getMacroIntegrazioneSociale() { return macroIntegrazioneSociale; }
    public void setMacroIntegrazioneSociale(BigDecimal macroIntegrazioneSociale) { this.macroIntegrazioneSociale = macroIntegrazioneSociale; }

    public List<Map<String, String>> getDistricts() { return districts; }
    public void setDistricts(List<Map<String, String>> districts) { this.districts = districts; }

    public BigDecimal getApartment1brOutside() { return apartment1brOutside; }
    public void setApartment1brOutside(BigDecimal apartment1brOutside) { this.apartment1brOutside = apartment1brOutside; }

    public BigDecimal getApartment3brOutside() { return apartment3brOutside; }
    public void setApartment3brOutside(BigDecimal apartment3brOutside) { this.apartment3brOutside = apartment3brOutside; }

    public BigDecimal getUtilitiesMonthly() { return utilitiesMonthly; }
    public void setUtilitiesMonthly(BigDecimal utilitiesMonthly) { this.utilitiesMonthly = utilitiesMonthly; }

    public BigDecimal getMobilePlanMonthly() { return mobilePlanMonthly; }
    public void setMobilePlanMonthly(BigDecimal mobilePlanMonthly) { this.mobilePlanMonthly = mobilePlanMonthly; }

    public BigDecimal getInternetMonthly() { return internetMonthly; }
    public void setInternetMonthly(BigDecimal internetMonthly) { this.internetMonthly = internetMonthly; }

    public BigDecimal getMealForTwoMidrange() { return mealForTwoMidrange; }
    public void setMealForTwoMidrange(BigDecimal mealForTwoMidrange) { this.mealForTwoMidrange = mealForTwoMidrange; }

    public BigDecimal getGasolinePerLiter() { return gasolinePerLiter; }
    public void setGasolinePerLiter(BigDecimal gasolinePerLiter) { this.gasolinePerLiter = gasolinePerLiter; }

    public BigDecimal getPublicTransportMonthly() { return publicTransportMonthly; }
    public void setPublicTransportMonthly(BigDecimal publicTransportMonthly) { this.publicTransportMonthly = publicTransportMonthly; }

    public BigDecimal getPreschoolMonthly() { return preschoolMonthly; }
    public void setPreschoolMonthly(BigDecimal preschoolMonthly) { this.preschoolMonthly = preschoolMonthly; }

    public BigDecimal getInternationalSchoolAnnual() { return internationalSchoolAnnual; }
    public void setInternationalSchoolAnnual(BigDecimal internationalSchoolAnnual) { this.internationalSchoolAnnual = internationalSchoolAnnual; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public AdminUser getCreatedBy() { return createdBy; }
    public void setCreatedBy(AdminUser createdBy) { this.createdBy = createdBy; }

    public AdminUser getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(AdminUser updatedBy) { this.updatedBy = updatedBy; }
}
