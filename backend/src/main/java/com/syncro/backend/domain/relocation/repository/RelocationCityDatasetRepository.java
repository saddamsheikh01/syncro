package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RelocationCityDatasetRepository extends JpaRepository<RelocationCityDataset, UUID> {

    Optional<RelocationCityDataset> findByCitySlugAndActiveTrue(String citySlug);

    List<RelocationCityDataset> findByActiveTrue();

    List<RelocationCityDataset> findByActiveTrueOrderByCityNameAsc();

    boolean existsByCitySlug(String citySlug);

    @Query("SELECT c.priceToIncomeRatio FROM RelocationCityDataset c WHERE c.active = true ORDER BY c.priceToIncomeRatio ASC")
    List<BigDecimal> findAllActivePriceToIncomeRatios();

    @Query("SELECT c.priceToRentCityCenterRatio FROM RelocationCityDataset c WHERE c.active = true ORDER BY c.priceToRentCityCenterRatio ASC")
    List<BigDecimal> findAllActivePriceToRentCityCenterRatios();
}
