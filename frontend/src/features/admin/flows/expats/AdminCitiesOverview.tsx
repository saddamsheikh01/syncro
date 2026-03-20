"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { formatNumber } from "@/features/admin/lib/formatters";
import { useT } from "@/hooks";
import {
  adminCreateExpatsCity,
  adminGetExpatsCities,
  adminGetExpatsCity,
  adminUpdateExpatsCity,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AdminCityDatasetResponse, AdminCreateCityPayload } from "@/types/adminExpats";
import { defaultCreateCityPayload, slugify } from "./cityFormDefaults";

const NUM_FIELDS: { key: keyof AdminCreateCityPayload; label: string }[] = [
  { key: "expatCommunityIndex", label: "Expat community" },
  { key: "socialIntegrationIndex", label: "Social integration" },
  { key: "careerOpportunityIndex", label: "Career opportunity" },
  { key: "remoteWorkEcosystemIndex", label: "Remote work" },
  { key: "rentIndex", label: "Rent index" },
  { key: "purchasingPowerIndex", label: "Purchasing power" },
  { key: "groceriesIndex", label: "Groceries" },
  { key: "restaurantIndex", label: "Restaurant" },
  { key: "costOfLivingExRentIndex", label: "CoL ex rent" },
  { key: "costOfLivingIncRentIndex", label: "CoL inc rent" },
  { key: "priceToIncomeRatio", label: "Price / income" },
  { key: "priceToRentCityCenterRatio", label: "Price / rent (center)" },
  { key: "safetyIndex", label: "Safety" },
  { key: "healthcareIndex", label: "Healthcare" },
  { key: "climateIndex", label: "Climate" },
  { key: "pollutionIndex", label: "Pollution" },
  { key: "trafficCommuteIndex", label: "Traffic / commute" },
  { key: "apartment1brCenter", label: "1BR center (EUR)" },
  { key: "apartment3brCenter", label: "3BR center (EUR)" },
  { key: "costSingleNoRent", label: "Single no rent (EUR)" },
  { key: "costFamilyNoRent", label: "Family no rent (EUR)" },
];

function cityToForm(c: AdminCityDatasetResponse): AdminCreateCityPayload {
  return {
    cityName: c.cityName,
    citySlug: c.citySlug,
    country: c.country,
    countryCode: c.countryCode,
    expatCommunityIndex: Number(c.expatCommunityIndex),
    socialIntegrationIndex: Number(c.socialIntegrationIndex),
    careerOpportunityIndex: Number(c.careerOpportunityIndex),
    remoteWorkEcosystemIndex: Number(c.remoteWorkEcosystemIndex),
    rentIndex: Number(c.rentIndex),
    purchasingPowerIndex: Number(c.purchasingPowerIndex),
    groceriesIndex: Number(c.groceriesIndex),
    restaurantIndex: Number(c.restaurantIndex),
    costOfLivingExRentIndex: Number(c.costOfLivingExRentIndex),
    costOfLivingIncRentIndex: Number(c.costOfLivingIncRentIndex),
    priceToIncomeRatio: Number(c.priceToIncomeRatio),
    priceToRentCityCenterRatio: Number(c.priceToRentCityCenterRatio),
    safetyIndex: Number(c.safetyIndex),
    healthcareIndex: Number(c.healthcareIndex),
    climateIndex: Number(c.climateIndex),
    pollutionIndex: Number(c.pollutionIndex),
    trafficCommuteIndex: Number(c.trafficCommuteIndex),
    apartment1brCenter: Number(c.apartment1brCenter),
    apartment3brCenter: Number(c.apartment3brCenter),
    costSingleNoRent: Number(c.costSingleNoRent),
    costFamilyNoRent: Number(c.costFamilyNoRent),
    districts: (c.districts ?? []).map((d) => ({
      name: d.name ?? "",
      description: d.description,
    })),
  };
}

export const AdminCitiesOverview = () => {
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [cities, setCities] = useState<AdminCityDatasetResponse[]>([]);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminCreateCityPayload>(defaultCreateCityPayload);
  const [districtsJson, setDistrictsJson] = useState("[]");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetExpatsCities();
      setCities(data);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setForm(defaultCreateCityPayload());
    setDistrictsJson("[]");
    setEditId(null);
    setMode("create");
  };

  const openEdit = async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const c = await adminGetExpatsCity(id);
      setForm(cityToForm(c));
      setDistrictsJson(JSON.stringify(c.districts ?? [], null, 2));
      setEditId(id);
      setMode("edit");
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const parseDistricts = (): { name: string; description?: string }[] => {
    try {
      const parsed = JSON.parse(districtsJson) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((x) => {
        if (x && typeof x === "object" && "name" in x) {
          const o = x as { name: string; description?: string };
          return { name: String(o.name), description: o.description };
        }
        return { name: "" };
      });
    } catch {
      return [];
    }
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const slug = form.citySlug.trim() || slugify(form.cityName);
    const payload: AdminCreateCityPayload = {
      ...form,
      citySlug: slug,
      districts: parseDistricts(),
    };
    try {
      await adminCreateExpatsCity(payload);
      setMode("list");
      await load();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setError(null);
    try {
      await adminUpdateExpatsCity(editId, {
        cityName: form.cityName,
        country: form.country,
        countryCode: form.countryCode,
        ...Object.fromEntries(
          NUM_FIELDS.map(({ key }) => [key, form[key]])
        ) as Partial<AdminCreateCityPayload>,
        districts: parseDistricts(),
      });
      setMode("list");
      setEditId(null);
      await load();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: AdminCityDatasetResponse) => {
    setError(null);
    try {
      await adminUpdateExpatsCity(c.id, { active: !c.active });
      await load();
    } catch (err) {
      setError(err as ApiError);
    }
  };

  const rows = useMemo(
    () =>
      cities.map((c) => ({
        id: c.id,
        city: `${c.cityName} (${c.country})`,
        slug: c.citySlug,
        active: c.active ? t("Yes") : t("No"),
        m1: formatNumber(Math.round(Number(c.macroCostoVita ?? 0))),
        m2: formatNumber(Math.round(Number(c.macroMercatoImmobiliare ?? 0))),
        m3: formatNumber(Math.round(Number(c.macroPotereEconomico ?? 0))),
        m4: formatNumber(Math.round(Number(c.macroQualitaVita ?? 0))),
        m5: formatNumber(Math.round(Number(c.macroOpportunitaLavorative ?? 0))),
        m6: formatNumber(Math.round(Number(c.macroIntegrazioneSociale ?? 0))),
        actions: (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void openEdit(c.id)}>
              {t("Edit")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void toggleActive(c)}>
              {c.active ? t("Deactivate") : t("Activate")}
            </Button>
          </div>
        ),
      })),
    [cities, t]
  );

  if (mode !== "list") {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={mode === "create" ? "Create city" : "Edit city"}
          subtitle="Raw indices; backend recalculates macroaree for all cities on save."
          actions={
            <Button variant="outline" size="sm" onClick={() => setMode("list")}>
              {t("Back to list")}
            </Button>
          }
        />
        {error ? (
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error.message}
          </Card>
        ) : null}
        <Card className="p-5">
          <form className="space-y-6" onSubmit={mode === "create" ? handleSaveCreate : handleSaveEdit}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Input
                label={t("City name")}
                value={form.cityName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cityName: e.target.value,
                    citySlug: mode === "create" ? slugify(e.target.value) : f.citySlug,
                  }))
                }
                required
              />
              <Input
                label={t("City slug")}
                value={form.citySlug}
                onChange={(e) => setForm((f) => ({ ...f, citySlug: e.target.value }))}
                required
                disabled={mode === "edit"}
              />
              <Input
                label={t("Country")}
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                required
              />
              <Input
                label={t("Country code")}
                value={form.countryCode}
                onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.slice(0, 5) }))}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {NUM_FIELDS.map(({ key, label }) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  step="any"
                  value={String(form[key])}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: Number(e.target.value) || 0 } as AdminCreateCityPayload))
                  }
                />
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-subtle">
                {t("Districts JSON")}
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-[var(--radius-md)] border border-border bg-card p-3 font-mono text-xs"
                value={districtsJson}
                onChange={(e) => setDistrictsJson(e.target.value)}
              />
            </div>
            <Button type="submit" loading={saving}>
              {mode === "create" ? t("Create city") : t("Save changes")}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Expats cities"
        subtitle="Manage relocation dataset. Macroaree are recalculated on every save."
        actions={
          <Button size="sm" onClick={openCreate}>
            {t("Add city")}
          </Button>
        }
      />
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </Card>
      ) : null}
      <Card className="p-5">
        {loading ? (
          <Loader />
        ) : (
          <AdminTable
            columns={[
              { key: "city", label: t("City") },
              { key: "slug", label: t("Slug") },
              { key: "active", label: t("Active") },
              { key: "m1", label: "Macro CoL" },
              { key: "m2", label: "Macro housing" },
              { key: "m3", label: "Macro econ" },
              { key: "m4", label: "Macro QoL" },
              { key: "m5", label: "Macro work" },
              { key: "m6", label: "Macro social" },
              { key: "actions", label: t("Actions"), align: "right" },
            ]}
            rows={rows}
            emptyLabel={t("No cities yet. Add at least one to enable WOW scoring.")}
          />
        )}
      </Card>
    </div>
  );
};
