package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BudgetCalculationHelperTest {

    private final BudgetCalculationHelper helper = new BudgetCalculationHelper();

    @Test
    void computeEntryCostFree_usesTwoMonthsDeposit() {
        RelocationCityDataset city = mock(RelocationCityDataset.class);
        lenient().when(city.getUtilitiesMonthly()).thenReturn(new BigDecimal("100"));
        lenient().when(city.getMobilePlanMonthly()).thenReturn(new BigDecimal("20"));
        lenient().when(city.getInternetMonthly()).thenReturn(new BigDecimal("30"));

        Map<String, Object> entryCost = helper.computeEntryCostFree(city, new BigDecimal("1500"), "single");

        assertEquals(new BigDecimal("1500"), entryCost.get("firstMonthRent"));
        assertEquals(new BigDecimal("3000.00"), entryCost.get("deposit"));
        assertEquals(new BigDecimal("250"), entryCost.get("basicSetup"));
        assertEquals(new BigDecimal("4750.00"), entryCost.get("totalEntryCost"));
    }

    @Test
    void computeEntryCostFree_scalesBasicSetupForFamily() {
        RelocationCityDataset city = mock(RelocationCityDataset.class);
        when(city.getUtilitiesMonthly()).thenReturn(new BigDecimal("120"));
        when(city.getMobilePlanMonthly()).thenReturn(new BigDecimal("25"));
        when(city.getInternetMonthly()).thenReturn(new BigDecimal("40"));

        Map<String, Object> entryCost = helper.computeEntryCostFree(city, new BigDecimal("2000"), "family");

        assertEquals(new BigDecimal("4000.00"), entryCost.get("deposit"));
        assertEquals(new BigDecimal("450"), entryCost.get("basicSetup"));
        assertEquals(new BigDecimal("6450.00"), entryCost.get("totalEntryCost"));
    }
}
