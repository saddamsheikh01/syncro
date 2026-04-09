package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.relocation.entity.RelocationCityDataset;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Component
public class BudgetCalculationHelper {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal TWO = new BigDecimal("2");
    private static final BigDecimal THREE = new BigDecimal("3");
    private static final BigDecimal FOUR = new BigDecimal("4");

    // ========== RENT RESOLUTION ==========

    public BigDecimal resolveRent(RelocationCityDataset city, String housingType, String location) {
        boolean outside = "outside".equalsIgnoreCase(location);

        return switch (housingType != null ? housingType : "1br_center") {
            case "1br_center" -> city.getApartment1brCenter();
            case "3br_center" -> city.getApartment3brCenter();
            case "1br_outside" -> fallback(city.getApartment1brOutside(), city.getApartment1brCenter());
            case "3br_outside" -> fallback(city.getApartment3brOutside(), city.getApartment3brCenter());
            case "2br_center" -> computeAvg(city.getApartment1brCenter(), city.getApartment3brCenter());
            case "2br_outside" -> computeAvg(
                    fallback(city.getApartment1brOutside(), city.getApartment1brCenter()),
                    fallback(city.getApartment3brOutside(), city.getApartment3brCenter()));
            case "room_shared" -> city.getApartment3brCenter()
                    .divide(THREE, 2, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("0.75"))
                    .setScale(2, RoundingMode.HALF_UP);
            default -> outside
                    ? fallback(city.getApartment1brOutside(), city.getApartment1brCenter())
                    : city.getApartment1brCenter();
        };
    }

    // ========== LIVING COST RESOLUTION ==========

    public BigDecimal resolveLivingCost(RelocationCityDataset city, String livingType) {
        return switch (livingType != null ? livingType : "single") {
            case "couple" -> computeCoupleCost(city);
            case "family" -> city.getCostFamilyNoRent();
            default -> city.getCostSingleNoRent();
        };
    }

    public BigDecimal computeCoupleCost(RelocationCityDataset city) {
        BigDecimal perPerson = city.getCostFamilyNoRent().divide(FOUR, 2, RoundingMode.HALF_UP);
        return perPerson.multiply(TWO).setScale(2, RoundingMode.HALF_UP);
    }

    // ========== ENTRY COST ==========

    public Map<String, Object> computeEntryCostFree(RelocationCityDataset city, BigDecimal rent, String livingType) {
        Map<String, Object> entry = new LinkedHashMap<>();
        BigDecimal firstMonthRent = rent;
        BigDecimal deposit = rent.multiply(TWO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal basicSetup = computeBasicSetup(city, livingType);

        entry.put("firstMonthRent", firstMonthRent);
        entry.put("deposit", deposit);
        entry.put("basicSetup", basicSetup);
        BigDecimal total = firstMonthRent.add(deposit).add(basicSetup);
        entry.put("totalEntryCost", total);
        return entry;
    }

    public Map<String, Object> computeEntryCostPremium(RelocationCityDataset city, BigDecimal rent,
                                                         String livingType, BigDecimal freeEntryCostTotal) {
        Map<String, Object> entry = computeEntryCostFree(city, rent, livingType);
        BigDecimal agencyFee = rent;
        BigDecimal hiddenCosts = freeEntryCostTotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal utilitiesSetup = city.getApartment1brCenter()
                .multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);

        entry.put("agencyFee", agencyFee);
        entry.put("hiddenCosts", hiddenCosts);
        entry.put("utilitiesSetup", utilitiesSetup);
        BigDecimal total = (BigDecimal) entry.get("totalEntryCost");
        total = total.add(agencyFee).add(hiddenCosts).add(utilitiesSetup);
        entry.put("totalEntryCost", total);
        return entry;
    }

    private BigDecimal computeBasicSetup(RelocationCityDataset city, String livingType) {
        BigDecimal utilities = fallback(city.getUtilitiesMonthly(), ZERO);
        BigDecimal mobile = fallback(city.getMobilePlanMonthly(), ZERO);
        BigDecimal internet = fallback(city.getInternetMonthly(), ZERO);

        if ("family".equals(livingType)) {
            return utilities.multiply(THREE).add(mobile.multiply(TWO)).add(internet);
        }
        return utilities.multiply(TWO).add(mobile).add(internet);
    }

    // ========== FINANCIAL METRICS ==========

    public BigDecimal computeMonthlyBalance(BigDecimal monthlyIncome, BigDecimal monthlyCost) {
        if (monthlyIncome == null) return null;
        return monthlyIncome.subtract(monthlyCost).setScale(2, RoundingMode.HALF_UP);
    }

    public Map<String, Object> computeFinancialRunway(BigDecimal savings, BigDecimal monthlyCost) {
        if (savings == null || monthlyCost.compareTo(ZERO) == 0) return null;
        BigDecimal months = savings.divide(monthlyCost, 1, RoundingMode.HALF_UP);
        String level;
        double m = months.doubleValue();
        if (m < 2) level = "CRITICAL";
        else if (m < 5) level = "MODERATE";
        else level = "SAFE";

        Map<String, Object> runway = new LinkedHashMap<>();
        runway.put("months", months);
        runway.put("level", level);
        return runway;
    }

    public BigDecimal computeRecommendedBudget(BigDecimal monthlyCost) {
        return monthlyCost.multiply(new BigDecimal("1.15")).setScale(2, RoundingMode.HALF_UP);
    }

    // ========== STABILITY SCORE (PREMIUM) ==========

    public Map<String, Object> computeStabilityScore(BigDecimal monthlyBalance, BigDecimal runwayMonths,
                                                       BigDecimal entryCost, BigDecimal monthlyBudget) {
        int score = 100;
        List<Map<String, Object>> penalties = new ArrayList<>();

        // 1. Monthly balance penalty
        if (monthlyBalance != null) {
            if (monthlyBalance.doubleValue() < 0) {
                score -= 40;
                penalties.add(penaltyItem("monthly_balance_negative", -40));
            } else if (monthlyBalance.doubleValue() < 300) {
                score -= 20;
                penalties.add(penaltyItem("monthly_balance_low", -20));
            }
        }

        // 2. Financial runway penalty
        if (runwayMonths != null) {
            double rm = runwayMonths.doubleValue();
            if (rm < 2) { score -= 40; penalties.add(penaltyItem("runway_critical", -40)); }
            else if (rm < 4) { score -= 25; penalties.add(penaltyItem("runway_low", -25)); }
            else if (rm < 6) { score -= 10; penalties.add(penaltyItem("runway_moderate", -10)); }
        }

        // 3. Entry cost pressure
        if (entryCost != null && monthlyBudget != null && monthlyBudget.compareTo(ZERO) > 0) {
            double ratio = entryCost.divide(monthlyBudget, 4, RoundingMode.HALF_UP).doubleValue();
            if (ratio > 1.5) { score -= 20; penalties.add(penaltyItem("entry_cost_high", -20)); }
            else if (ratio > 1.0) { score -= 10; penalties.add(penaltyItem("entry_cost_moderate", -10)); }
        }

        score = Math.max(0, score);
        String level;
        if (score >= 80) level = "SAFE";
        else if (score >= 60) level = "STABLE";
        else if (score >= 40) level = "MODERATE_RISK";
        else level = "HIGH_RISK";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score);
        result.put("level", level);
        result.put("penalties", penalties);
        return result;
    }

    // ========== SUPER PRO: FAMILY VARIABLES ==========

    public BigDecimal computeFamilyCost(RelocationCityDataset city, int numberOfChildren, boolean hasPet) {
        BigDecimal singleCost = city.getCostSingleNoRent();
        BigDecimal coupleCost = singleCost.multiply(new BigDecimal("1.6")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal childCost = singleCost.multiply(new BigDecimal("0.45")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal familyCost = coupleCost.add(childCost.multiply(BigDecimal.valueOf(numberOfChildren)));

        if (hasPet) {
            BigDecimal petCost = singleCost.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
            familyCost = familyCost.add(petCost);
        }
        return familyCost.setScale(2, RoundingMode.HALF_UP);
    }

    // ========== SUPER PRO: SCHOOLS ==========

    public BigDecimal computeSchoolsCost(RelocationCityDataset city, List<Integer> childrenAges) {
        if (childrenAges == null || childrenAges.isEmpty()) return ZERO;
        BigDecimal total = ZERO;
        for (int age : childrenAges) {
            if (age <= 5) {
                total = total.add(fallback(city.getPreschoolMonthly(), ZERO));
            } else if (age < 18) {
                BigDecimal annualSchool = fallback(city.getInternationalSchoolAnnual(), ZERO);
                total = total.add(annualSchool.divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP));
            }
        }
        return total;
    }

    // ========== SUPER PRO: EATING OUT ==========

    public BigDecimal computeEatingOut(RelocationCityDataset city, String livingType,
                                         int numberOfChildren, String frequency) {
        BigDecimal mealForTwo = fallback(city.getMealForTwoMidrange(), ZERO);
        if (mealForTwo.compareTo(ZERO) == 0) return ZERO;

        BigDecimal baseCost;
        if ("single".equals(livingType)) {
            baseCost = mealForTwo.divide(TWO, 2, RoundingMode.HALF_UP);
        } else if ("family".equals(livingType) && numberOfChildren > 0) {
            baseCost = mealForTwo.add(BigDecimal.valueOf(15L * numberOfChildren));
        } else {
            baseCost = mealForTwo;
        }

        int freq = switch (frequency != null ? frequency : "moderate") {
            case "rare" -> 1;
            case "frequent" -> 8;
            default -> 4;
        };

        return baseCost.multiply(BigDecimal.valueOf(freq)).setScale(2, RoundingMode.HALF_UP);
    }

    // ========== SUPER PRO: TRANSPORT ==========

    public BigDecimal computeTransport(RelocationCityDataset city, String mode, boolean isFamily) {
        if ("car".equals(mode)) {
            BigDecimal gasoline = fallback(city.getGasolinePerLiter(), ZERO);
            BigDecimal fuelCost = BigDecimal.valueOf(48).multiply(gasoline).setScale(2, RoundingMode.HALF_UP);
            return fuelCost.add(new BigDecimal("120.00"));
        }
        BigDecimal publicCost = fallback(city.getPublicTransportMonthly(), ZERO);
        return isFamily ? publicCost.multiply(TWO) : publicCost;
    }

    // ========== SUPER PRO: LEISURE ==========

    public BigDecimal computeLeisure(RelocationCityDataset city, String livingType,
                                       int numberOfChildren, String level) {
        BigDecimal base = city.getCostSingleNoRent();
        double pct = switch (level != null ? level : "regular") {
            case "minimal" -> 0.05;
            case "active" -> 0.20;
            default -> 0.12;
        };

        double multiplier = switch (livingType != null ? livingType : "single") {
            case "couple" -> 1.6;
            case "family" -> 1.6 + (0.5 * numberOfChildren);
            default -> 1.0;
        };

        return base.multiply(BigDecimal.valueOf(pct))
                .multiply(BigDecimal.valueOf(multiplier))
                .setScale(2, RoundingMode.HALF_UP);
    }

    // ========== SUPER PRO: TIME SIMULATION ==========

    public List<Map<String, Object>> computeTimeSimulation(BigDecimal savings, BigDecimal entryCost,
                                                              BigDecimal monthlyIncome, BigDecimal monthlyCost) {
        BigDecimal buffer = (savings != null ? savings : ZERO).subtract(entryCost != null ? entryCost : ZERO);
        BigDecimal monthlyDelta = monthlyIncome.subtract(monthlyCost);

        List<Map<String, Object>> projections = new ArrayList<>();
        for (int m : List.of(1, 3, 6)) {
            BigDecimal balance = buffer.add(monthlyDelta.multiply(BigDecimal.valueOf(m)));
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", m);
            point.put("balance", balance.setScale(2, RoundingMode.HALF_UP));
            point.put("status", balance.compareTo(ZERO) >= 0 ? "POSITIVE" : "NEGATIVE");
            projections.add(point);
        }
        return projections;
    }

    // ========== AI INSIGHT SUMMARY (rule-based) ==========

    public String generateInsightSummary(int stabilityScore, BigDecimal runwayMonths, BigDecimal monthlyBalance) {
        StringBuilder sb = new StringBuilder();

        if (stabilityScore >= 80) {
            sb.append("Your financial situation is solid for this relocation. ");
        } else if (stabilityScore >= 60) {
            sb.append("You can afford this move, but your financial buffer is limited. ");
        } else if (stabilityScore >= 40) {
            sb.append("This relocation carries moderate financial risk. ");
        } else {
            sb.append("This relocation carries significant financial risk. ");
        }

        if (runwayMonths != null && runwayMonths.doubleValue() < 3) {
            sb.append("Your low runway makes you vulnerable to unexpected events. ");
        } else if (monthlyBalance != null && monthlyBalance.doubleValue() < 0) {
            sb.append("Your monthly expenses exceed your income, which is not sustainable long-term. ");
        } else if (monthlyBalance != null && monthlyBalance.doubleValue() < 300) {
            sb.append("Your monthly margin is tight, leaving little room for surprises. ");
        }

        if (stabilityScore < 60) {
            sb.append("Improving your savings or reducing fixed costs would increase your stability.");
        } else {
            sb.append("Maintaining an emergency fund will ensure a smoother transition.");
        }

        return sb.toString().trim();
    }

    // ========== UTILITIES ==========

    private BigDecimal fallback(BigDecimal value, BigDecimal defaultValue) {
        return value != null ? value : defaultValue;
    }

    private BigDecimal computeAvg(BigDecimal a, BigDecimal b) {
        return a.add(b).divide(TWO, 2, RoundingMode.HALF_UP);
    }

    private Map<String, Object> penaltyItem(String reason, int points) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("reason", reason);
        item.put("points", points);
        return item;
    }
}
