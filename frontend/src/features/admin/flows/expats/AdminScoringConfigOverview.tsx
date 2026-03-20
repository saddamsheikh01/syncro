"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import { adminGetScoringConfig, adminUpdateScoringConfig } from "@/services/admin";
import { normalizeApiError } from "@/services/axiosConfig";
import type { ApiError } from "@/types/api";
import type { AdminScoringConfigResponse, AdminUpdateScoringConfigPayload } from "@/types/adminExpats";

type MapKey = keyof AdminUpdateScoringConfigPayload;

const MAP_LABELS: { key: MapKey; label: string }[] = [
  { key: "thresholds", label: "thresholds" },
  { key: "budgetMarginThresholds", label: "budgetMarginThresholds" },
  { key: "budgetPenaltyThresholds", label: "budgetPenaltyThresholds" },
  { key: "lifestyleMultipliers", label: "lifestyleMultipliers" },
  { key: "priorityThresholds", label: "priorityThresholds" },
  { key: "cityPerformanceThresholds", label: "cityPerformanceThresholds" },
];

function responseToStrings(c: AdminScoringConfigResponse): Record<MapKey, string> {
  const out = {} as Record<MapKey, string>;
  for (const { key } of MAP_LABELS) {
    const v = c[key as keyof AdminScoringConfigResponse];
    out[key] = JSON.stringify(v ?? {}, null, 2);
  }
  return out;
}

export const AdminScoringConfigOverview = () => {
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [config, setConfig] = useState<AdminScoringConfigResponse | null>(null);
  const [jsonByKey, setJsonByKey] = useState<Record<MapKey, string> | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<MapKey, string>>>({});

  const labelByKey = useMemo(() => Object.fromEntries(MAP_LABELS.map(({ key, label }) => [key, label])) as Record<MapKey, string>, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetScoringConfig();
      setConfig(data);
      setJsonByKey(responseToStrings(data));
    } catch (e) {
      setError(normalizeApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !jsonByKey) return;
    setSaving(true);
    setError(null);
    const nextFieldErrors: Partial<Record<MapKey, string>> = {};
    const payload: AdminUpdateScoringConfigPayload = {};

    for (const { key } of MAP_LABELS) {
      const raw = jsonByKey[key];
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        nextFieldErrors[key] = t("Admin.scoringConfig.invalidJson", { section: labelByKey[key] });
        continue;
      }
      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        Object.keys(parsed as object).length > 0
      ) {
        payload[key] = parsed as Record<string, unknown>;
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSaving(false);
      return;
    }

    setFieldErrors({});
    try {
      const updated = await adminUpdateScoringConfig(config.id, payload);
      setConfig(updated);
      setJsonByKey(responseToStrings(updated));
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Scoring config"
        subtitle="Active relocation scoring thresholds and multipliers (JSON per section)."
      />
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </Card>
      ) : null}
      {loading || !config || !jsonByKey ? (
        <Card className="p-8">
          <Loader />
        </Card>
      ) : (
        <Card className="p-5">
          <p className="mb-4 text-sm text-subtle">
            configKey: <code className="rounded bg-surface-muted px-1">{config.configKey}</code> · id:{" "}
            <code className="rounded bg-surface-muted px-1">{config.id}</code>
          </p>
          <form className="space-y-4" onSubmit={handleSave}>
            {MAP_LABELS.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-subtle">{label}</label>
                <textarea
                  className="min-h-[100px] w-full rounded-[var(--radius-md)] border border-border bg-card p-3 font-mono text-xs"
                  value={jsonByKey[key]}
                  onChange={(e) => {
                    setFieldErrors((prev) => {
                      if (!prev[key]) return prev;
                      const next = { ...prev };
                      delete next[key];
                      return next;
                    });
                    setJsonByKey((prev) => (prev ? { ...prev, [key]: e.target.value } : prev));
                  }}
                  aria-invalid={Boolean(fieldErrors[key])}
                />
                {fieldErrors[key] ? (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors[key]}</p>
                ) : null}
              </div>
            ))}
            <Button type="submit" loading={saving}>
              {t("Save changes")}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};
