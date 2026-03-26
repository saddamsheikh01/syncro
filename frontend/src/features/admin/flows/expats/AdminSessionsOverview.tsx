"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGetSessions } from "@/services/admin/expats";
import { normalizeApiError } from "@/services/axiosConfig";
import type { AdminSessionResponse } from "@/types/adminExpats";
import type { PageResponse } from "@/types/shared";
import type { ApiError } from "@/types/api";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { Badge } from "@/components/elements/Badge";
import { useT } from "@/hooks";
import { formatDateTime } from "@/features/admin/lib/formatters";
import { formatQuestionKey, formatAnswerValue } from "@/features/admin/lib/funnelLabels";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CONVERTED", label: "Converted" },
  { value: "EXPIRED", label: "Expired" },
];

function statusBadgeTone(status: string): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "CONVERTED": return "success";
    case "COMPLETED": return "warning";
    case "EXPIRED": return "danger";
    default: return "neutral";
  }
}

export const AdminSessionsOverview = () => {
  const { t } = useT();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<PageResponse<AdminSessionResponse> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetSessions({
        status: statusFilter || undefined,
        page,
        size: 20,
      });
      setResponse(data);
    } catch (e) {
      setError(normalizeApiError(e) as ApiError);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(
    () =>
      (response?.content ?? []).map((session) => ({
        id: session.id,
        status: (
          <Badge tone={statusBadgeTone(session.status)}>
            {session.status}
          </Badge>
        ),
        user: session.converted ? (
          <div className="flex flex-col gap-0.5">
            <Badge tone="success">{t("Registered")}</Badge>
            {session.convertedUserEmail ? (
              <span className="text-xs text-muted">{session.convertedUserEmail}</span>
            ) : null}
          </div>
        ) : (
          <Badge tone="neutral">{t("Anonymous")}</Badge>
        ),
        userType: session.userType ?? "—",
        progress: `${session.currentStep}/${session.totalSteps}`,
        targetCity: session.targetCityName ?? "—",
        currentCity: session.currentCityName ?? "—",
        createdAt: formatDateTime(session.createdAt),
        actions: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
          >
            {expandedId === session.id ? t("Hide") : t("Answers")}
          </Button>
        ),
      })),
    [response, t, expandedId]
  );

  const expandedSession = useMemo(
    () => response?.content?.find((s) => s.id === expandedId) ?? null,
    [response, expandedId]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Funnel Sessions")}
        subtitle={t("Track anonymous funnel sessions: answers, cities, completion and conversion.")}
      />

      <Card className="flex items-end gap-4 p-5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">{t("Filter by status")}</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <p className="pb-2 text-sm text-subtle">
          {t("Total: {count}", { count: String(response?.totalElements ?? 0) })}
        </p>
      </Card>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading sessions...")}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">{t("Unable to load sessions")}</p>
          <p className="text-sm text-muted">{error.message}</p>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "status", label: t("Status"), width: "100px" },
              { key: "user", label: t("User") },
              { key: "userType", label: t("Type") },
              { key: "progress", label: t("Step") },
              { key: "targetCity", label: t("Target city") },
              { key: "currentCity", label: t("Current city") },
              { key: "createdAt", label: t("Created") },
              { key: "actions", label: "", align: "right" },
            ]}
            rows={rows}
            emptyLabel={t("No sessions found.")}
          />

          {expandedSession ? (
            <Card className="space-y-5 p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t("Session detail")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {expandedSession.id.slice(0, 8)}... · {formatDateTime(expandedSession.createdAt)}
                  </p>
                </div>
                {expandedSession.metadata?.device ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {String(expandedSession.metadata.device)}
                    {expandedSession.metadata.referrer ? ` · ${String(expandedSession.metadata.referrer).replace(/https?:\/\//, "").split("/")[0]}` : ""}
                  </span>
                ) : null}
              </div>

              {/* Answer cards */}
              <div className="grid gap-3">
                {expandedSession.answers.map((a, i) => {
                  const raw = typeof a.answerValue === "string" ? a.answerValue : JSON.stringify(a.answerValue);
                  const formatted = formatAnswerValue(raw);
                  const groupColor =
                    a.questionGroup === "CITY_FIT" ? "bg-blue-50 text-blue-700" :
                    a.questionGroup === "POSITIONING" ? "bg-purple-50 text-purple-700" :
                    "bg-amber-50 text-amber-700";

                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3">
                      {/* Step number */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {a.stepNumber}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatQuestionKey(a.questionKey)}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${groupColor}`}>
                            {a.questionGroup === "CITY_FIT" ? "City Fit" :
                             a.questionGroup === "POSITIONING" ? "Positioning" : "Execution"}
                          </span>
                          {a.version > 1 ? (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                              v{a.version}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {formatted}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={(response?.number ?? 0) <= 0}
            >
              {t("Previous")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={Boolean(response?.last ?? true)}
            >
              {t("Next")}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};
