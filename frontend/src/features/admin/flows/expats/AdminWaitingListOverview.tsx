"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { Modal } from "@/components/ui/Modal";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { useT } from "@/hooks";
import { adminGetWaitingList, adminNotifyWaitingList } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AdminWaitingListEntry } from "@/types/adminExpats";

function formatRequestedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export const AdminWaitingListOverview = () => {
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [entries, setEntries] = useState<AdminWaitingListEntry[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmCity, setConfirmCity] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetWaitingList();
      setEntries(data);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byCity = useMemo(() => {
    const m = new Map<string, AdminWaitingListEntry[]>();
    for (const e of entries) {
      const key = e.cityName?.trim() || "—";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [entries]);

  const citySummaryRows = useMemo(
    () =>
      byCity.map(([cityName, list]) => ({
        id: `city-${cityName}`,
        city: cityName,
        count: String(list.length),
        actions:
          cityName === "—" ? (
            <span className="text-xs text-subtle">—</span>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirmCity(cityName)}>
              {t("Mark notified")}
            </Button>
          ),
      })),
    [byCity, t]
  );

  const detailRows = useMemo(
    () =>
      entries.map((e) => ({
        id: e.id,
        email: e.email,
        city: e.cityName?.trim() || "—",
        created: formatRequestedAt(e.createdAt),
      })),
    [entries]
  );

  const confirmCount =
    confirmCity && confirmCity !== "—"
      ? (byCity.find(([c]) => c === confirmCity)?.[1].length ?? 0)
      : 0;

  const handleConfirmNotify = async () => {
    if (!confirmCity || confirmCity === "—") {
      setConfirmCity(null);
      return;
    }
    setNotifying(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await adminNotifyWaitingList(confirmCity);
      setSuccessMessage(
        t("Waiting list: marked {count} as notified for {city}.", {
          count: res.notifiedCount,
          city: res.cityName,
        })
      );
      setConfirmCity(null);
      await load();
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Expats waiting list"
        subtitle="Users waiting for cities not yet in the dataset. Mark a city as notified after you add it."
        actions={
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {t("Refresh")}
          </Button>
        }
      />

      {successMessage ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-foreground">
          {successMessage}
        </Card>
      ) : null}

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </Card>
      ) : null}

      <Modal
        open={confirmCity != null && confirmCity !== "—"}
        onClose={() => setConfirmCity(null)}
        title={t("Mark city as notified")}
        description={
          confirmCity && confirmCity !== "—"
            ? t('This sets notified=true for {count} waiting list row(s) for "{city}". Run after the city exists in the dataset.', {
                count: confirmCount,
                city: confirmCity,
              })
            : undefined
        }
        primaryAction={{
          label: t("Confirm"),
          onClick: () => void handleConfirmNotify(),
          loading: notifying,
        }}
        secondaryAction={{
          label: t("Cancel"),
          onClick: () => setConfirmCity(null),
          variant: "outline",
        }}
      />

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">{t("By city")}</h2>
        {loading ? (
          <Loader />
        ) : (
          <AdminTable
            columns={[
              { key: "city", label: t("City") },
              { key: "count", label: t("Waiting") },
              { key: "actions", label: t("Actions"), align: "right" },
            ]}
            rows={citySummaryRows}
            emptyLabel={t("No waiting list entries")}
          />
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">{t("All entries")}</h2>
        {loading ? (
          <Loader />
        ) : (
          <AdminTable
            columns={[
              { key: "email", label: t("Email") },
              { key: "city", label: t("City") },
              { key: "created", label: t("Requested") },
            ]}
            rows={detailRows}
            emptyLabel={t("No waiting list entries")}
          />
        )}
      </Card>
    </div>
  );
};
