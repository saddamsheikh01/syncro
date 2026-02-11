"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { getReferralCodes, getReferralDetail, getReferralUsages } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AdminReferralCodeResponse,
  AdminReferralDetailResponse,
  AdminReferralUsageResponse,
} from "@/types/admin";
import type { PageResponse } from "@/types/shared";

export const AdminReferralsOverview = () => {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [codesResponse, setCodesResponse] =
    useState<PageResponse<AdminReferralCodeResponse> | null>(null);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [detail, setDetail] = useState<AdminReferralDetailResponse | null>(null);

  const [usagePage, setUsagePage] = useState(0);
  const [usageResponse, setUsageResponse] =
    useState<PageResponse<AdminReferralUsageResponse> | null>(null);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getReferralCodes({ page, size: 20 });
      setCodesResponse(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadDetail = useCallback(async (code: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      const response = await getReferralDetail(code);
      setDetail(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadUsages = useCallback(async (code: string, pageNumber: number) => {
    setUsageLoading(true);
    setError(null);

    try {
      const response = await getReferralUsages(code, { page: pageNumber, size: 50 });
      setUsageResponse(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    if (!selectedCode) {
      setDetail(null);
      setUsageResponse(null);
      return;
    }

    void loadDetail(selectedCode);
  }, [loadDetail, selectedCode]);

  useEffect(() => {
    if (!selectedCode) {
      return;
    }

    void loadUsages(selectedCode, usagePage);
  }, [loadUsages, selectedCode, usagePage]);

  const codeRows = useMemo(
    () =>
      (codesResponse?.content ?? []).map((code) => ({
        id: code.code,
        code: code.code,
        owner: code.email ?? code.username ?? "-",
        usesCount: formatNumber(code.usesCount),
        createdAt: formatDateTime(code.createdAt),
        actions: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCode(code.code);
              setUsagePage(0);
            }}
          >
            Apri dettaglio
          </Button>
        ),
      })),
    [codesResponse]
  );

  const usageRows = useMemo(
    () =>
      (usageResponse?.content ?? []).map((usage, index) => ({
        id: `${usage.invitedUserId ?? usage.createdAt}-${index}`,
        invited: usage.invitedEmail ?? usage.invitedUsername ?? usage.invitedUserId ?? "-",
        createdAt: formatDateTime(usage.createdAt),
        ip: usage.ip ?? "-",
        userAgent: usage.userAgent ?? "-",
      })),
    [usageResponse]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Referrals</h1>
        <p className="mt-1 text-sm text-muted">
          Monitoraggio codici referral e relativi utilizzi.
        </p>
      </div>

      <Card className="p-5">
        <p className="text-sm text-subtle">
          Totale codici referral: {formatNumber(codesResponse?.totalElements ?? 0)}
        </p>
      </Card>

      {selectedCode ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Dettaglio codice: {selectedCode}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedCode(null)}>
              Chiudi dettaglio
            </Button>
          </div>

          {detail ? (
            <div className="grid gap-3 md:grid-cols-2">
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">Owner:</span>{" "}
                {detail.email ?? detail.username ?? detail.userId ?? "-"}
              </p>
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">Use count:</span>{" "}
                {formatNumber(detail.usesCount)}
              </p>
              <p className="text-sm text-muted md:col-span-2">
                <span className="font-semibold text-foreground">Creato il:</span>{" "}
                {formatDateTime(detail.createdAt)}
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Utilizzi codice</h3>
              <p className="text-xs text-subtle">
                Totale: {formatNumber(usageResponse?.totalElements ?? 0)}
              </p>
            </div>

            <AdminTable
              columns={[
                { key: "invited", label: "Utente invitato" },
                { key: "createdAt", label: "Data utilizzo" },
                { key: "ip", label: "IP" },
                { key: "userAgent", label: "User Agent" },
              ]}
              rows={usageRows}
              emptyLabel="Nessun utilizzo rilevato"
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUsagePage((current) => Math.max(0, current - 1))}
                disabled={(usageResponse?.number ?? 0) <= 0}
              >
                Precedente
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUsagePage((current) => current + 1)}
                disabled={Boolean(usageResponse?.last ?? true)}
              >
                Successiva
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {loading || detailLoading || usageLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">
            {loading
              ? "Caricamento referral..."
              : detailLoading
                ? "Caricamento dettaglio referral..."
                : "Caricamento utilizzi referral..."}
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Errore referrals</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadCodes()}>
            Riprova
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "code", label: "Codice" },
              { key: "owner", label: "Owner" },
              { key: "usesCount", label: "Utilizzi" },
              { key: "createdAt", label: "Creato il" },
              { key: "actions", label: "Azioni", align: "right" },
            ]}
            rows={codeRows}
            emptyLabel="Nessun referral trovato"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              Pagina {(codesResponse?.number ?? 0) + 1} di {Math.max(codesResponse?.totalPages ?? 1, 1)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={(codesResponse?.number ?? 0) <= 0}
              >
                Precedente
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={Boolean(codesResponse?.last ?? true)}
              >
                Successiva
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
