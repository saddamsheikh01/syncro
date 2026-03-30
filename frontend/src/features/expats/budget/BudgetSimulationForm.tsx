"use client";

import { useState } from "react";
import { useT } from "@/hooks";
import type { CreateBudgetSimulationRequest, CityListItem } from "../../../types/expats";

interface BudgetSimulationFormProps {
  planCode: string;
  cities: CityListItem[];
  isLoading: boolean;
  onSubmit: (payload: CreateBudgetSimulationRequest) => void;
}

export default function BudgetSimulationForm({
  planCode,
  cities,
  isLoading,
  onSubmit,
}: BudgetSimulationFormProps) {
  const { t } = useT();
  const [monthlyBudget, setMonthlyBudget] = useState<string>("");
  const [household, setHousehold] = useState<string>("alone");
  const [cityId, setCityId] = useState<string>("");
  const [desiredLifestyle, setDesiredLifestyle] = useState<string>("balanced");
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [projectionMonths, setProjectionMonths] = useState<number>(12);

  const isPremiumOrAbove = planCode === "PREMIUM" || planCode === "SUPER_PRO";
  const isSuperPro = planCode === "SUPER_PRO";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateBudgetSimulationRequest = {
      planCode,
      cityId: cityId || null,
      monthlyBudget: monthlyBudget ? Number(monthlyBudget) : null,
      household,
      desiredLifestyle,
      monthlyIncome: isPremiumOrAbove && monthlyIncome ? Number(monthlyIncome) : null,
      projectionMonths: isSuperPro ? projectionMonths : null,
    };
    onSubmit(payload);
  };

  return (
    <>
      <form className="sim-form" onSubmit={handleSubmit}>
        <div className="sim-form__grid">
          {/* City */}
          <div className="sim-form__field">
            <label htmlFor="sim-city">{t("Target City")}</label>
            <select id="sim-city" value={cityId} onChange={(e) => setCityId(e.target.value)}>
              <option value="">{t("Use profile city")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cityName}, {c.country}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Budget */}
          <div className="sim-form__field">
            <label htmlFor="sim-budget">{t("Monthly Budget")} (EUR)</label>
            <input
              id="sim-budget"
              type="number"
              min={0}
              step={50}
              placeholder={t("Use profile budget")}
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
            />
          </div>

          {/* Household */}
          <div className="sim-form__field">
            <label htmlFor="sim-household">{t("Household")}</label>
            <select id="sim-household" value={household} onChange={(e) => setHousehold(e.target.value)}>
              <option value="alone">{t("Alone")}</option>
              <option value="with_partner">{t("With Partner")}</option>
              <option value="with_children">{t("With Children")}</option>
            </select>
          </div>

          {/* Lifestyle */}
          <div className="sim-form__field">
            <label htmlFor="sim-lifestyle">{t("Desired Lifestyle")}</label>
            <select id="sim-lifestyle" value={desiredLifestyle} onChange={(e) => setDesiredLifestyle(e.target.value)}>
              <option value="essential">{t("Essential")}</option>
              <option value="balanced">{t("Balanced")}</option>
              <option value="comfort">{t("Comfort")}</option>
              <option value="experience">{t("Experience")}</option>
            </select>
          </div>

          {/* Monthly Income (PREMIUM+) */}
          {isPremiumOrAbove && (
            <div className="sim-form__field">
              <label htmlFor="sim-income">{t("Monthly Income")} (EUR) *</label>
              <input
                id="sim-income"
                type="number"
                min={1}
                step="any"
                required
                placeholder={t("Required for this plan")}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
            </div>
          )}

          {/* Projection Months (SUPER_PRO) */}
          {isSuperPro && (
            <div className="sim-form__field">
              <label htmlFor="sim-projection">
                {t("Projection")} ({projectionMonths} {t("months")})
              </label>
              <input
                id="sim-projection"
                type="range"
                min={6}
                max={24}
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <button className="sim-form__submit" type="submit" disabled={isLoading}>
          {isLoading ? t("Simulating...") : t("Run Simulation")}
        </button>
      </form>
      <style>{`
        .sim-form {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
        }
        .sim-form__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 640px) {
          .sim-form__grid {
            grid-template-columns: 1fr;
          }
        }
        .sim-form__field label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }
        .sim-form__field input,
        .sim-form__field select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e4e9f2;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #0d1b36;
          background: #f8fafd;
          transition: border-color 0.2s;
        }
        .sim-form__field input:focus,
        .sim-form__field select:focus {
          outline: none;
          border-color: #3b6bdc;
          box-shadow: 0 0 0 3px rgba(59, 107, 220, 0.1);
        }
        .sim-form__field input[type="range"] {
          padding: 0;
          height: 6px;
          margin-top: 8px;
          accent-color: #3b6bdc;
        }
        .sim-form__submit {
          width: 100%;
          padding: 14px;
          background: #3b6bdc;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sim-form__submit:hover:not(:disabled) {
          background: #2d5bc7;
        }
        .sim-form__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
