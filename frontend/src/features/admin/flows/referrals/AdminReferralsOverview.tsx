"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import {
  getReferralCodes,
  getReferralDetail,
  getReferralUsages,
  getUser,
  getUserProfile,
  getUserTestsCount,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AdminReferralCodeResponse,
  AdminReferralDetailResponse,
  AdminReferralUsageResponse,
} from "@/types/admin";
import type { UserResponse } from "@/types/auth";
import type { UserProfileResponse } from "@/types/profile";
import type { PageResponse } from "@/types/shared";

export const AdminReferralsOverview = () => {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [codesResponse, setCodesResponse] =
    useState<PageResponse<AdminReferralCodeResponse> | null>(null);

  const [query, setQuery] = useState("");
  const [queryFilter, setQueryFilter] = useState<string | null>(null);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [detail, setDetail] = useState<AdminReferralDetailResponse | null>(null);

  const [usagePage, setUsagePage] = useState(0);
  const [usageResponse, setUsageResponse] =
    useState<PageResponse<AdminReferralUsageResponse> | null>(null);

  const [selectedInvitedUserId, setSelectedInvitedUserId] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<UserResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [userTestsCount, setUserTestsCount] = useState<number | null>(null);
  const [userModalError, setUserModalError] = useState<ApiError | null>(null);
  const [profileFieldsOpen, setProfileFieldsOpen] = useState(false);
  const [profileFieldsFilter, setProfileFieldsFilter] = useState<
    "missing" | "filled" | "all"
  >("missing");

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getReferralCodes({
        page,
        size: 20,
        q: queryFilter ?? undefined,
      });
      setCodesResponse(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [page, queryFilter]);

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
      const response = await getReferralUsages(code, {
        page: pageNumber,
        size: 50,
        includeProgress: true,
      });
      setUsageResponse(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const openUserModal = useCallback(async (userId: string) => {
    setSelectedInvitedUserId(userId);
    setUserModalOpen(true);
    setUserLoading(true);
    setUserModalError(null);
    setUserDetail(null);
    setUserProfile(null);
    setUserTestsCount(null);
    setProfileFieldsOpen(false);
    setProfileFieldsFilter("missing");

    try {
      const [detailResponse, testsResponse] = await Promise.all([
        getUser(userId),
        getUserTestsCount(userId),
      ]);

      let profileResponse: UserProfileResponse | null = null;
      try {
        profileResponse = await getUserProfile(userId);
      } catch (profileError) {
        const maybeApiError = profileError as ApiError;
        if (maybeApiError?.status !== 404) {
          throw profileError;
        }
      }

      setUserDetail(detailResponse);
      setUserTestsCount(testsResponse.count ?? null);
      setUserProfile(profileResponse);
    } catch (requestError) {
      setUserModalError(requestError as ApiError);
    } finally {
      setUserLoading(false);
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

  const profileFields = useMemo(() => {
    if (!userProfile) {
      return [];
    }

    const rows = [
      ["Full name", userProfile.fullName],
      ["Birth date", userProfile.birthDate],
      ["City", userProfile.city],
      ["Country", userProfile.country],
      ["Job title", userProfile.jobTitle],
      ["Company", userProfile.companyName],
      ["Bio", userProfile.bio],
      ["What defines me", userProfile.traitsText],
      ["Loves", userProfile.lovesText],
      ["Dislikes", userProfile.dislikesText],
      ["What I'm looking for", userProfile.goalsText],
      ["Values", userProfile.valuesText],
      ["Relationship status", userProfile.relationshipStatus],
      ["Orientation", userProfile.orientation],
      ["Children status", userProfile.childrenStatus],
      ["Visibility", userProfile.visibility],
    ] as const;

    return rows.map(([label, value]) => {
      const filled = !(
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim().length === 0)
      );
      return { label, value, filled };
    });
  }, [userProfile]);

  const profileFieldsStats = useMemo(() => {
    const total = profileFields.length;
    const filled = profileFields.filter((field) => field.filled).length;
    const missing = total - filled;
    return { total, filled, missing };
  }, [profileFields]);

  const filteredProfileFields = useMemo(() => {
    if (!profileFields.length) {
      return [];
    }
    if (profileFieldsFilter === "missing") {
      return profileFields.filter((field) => !field.filled);
    }
    if (profileFieldsFilter === "filled") {
      return profileFields.filter((field) => field.filled);
    }
    return profileFields;
  }, [profileFields, profileFieldsFilter]);

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
            Open details
          </Button>
        ),
      })),
    [codesResponse]
  );

  const renderYesNo = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) {
      return (
        <Badge tone="neutral" size="sm">
          N/A
        </Badge>
      );
    }

    return value ? (
      <Badge tone="success-light" size="sm">
        Yes
      </Badge>
    ) : (
      <Badge tone="neutral" size="sm">
        No
      </Badge>
    );
  };

  const resolvePrimaryActivityLabel = (activity: string | null | undefined) => {
    switch (activity) {
      case "MOMENT":
        return "Moment";
      case "INSIGHTS":
        return "Insights";
      case "CHAT":
        return "Chat";
      case "FAVORITE":
        return "Favorite";
      case "PROFILE":
        return "Profile";
      case "ONBOARDING":
        return "Onboarding";
      case "NONE":
        return "None";
      default:
        return activity ?? "-";
    }
  };

  const usageRows = useMemo(
    () =>
      (usageResponse?.content ?? []).map((usage, index) => ({
        id: `${usage.invitedUserId ?? usage.createdAt}-${index}`,
        invited: usage.invitedUserId ? (
          <button
            type="button"
            className="text-left font-semibold text-accent hover:underline"
            onClick={() => void openUserModal(usage.invitedUserId as string)}
          >
            {usage.invitedEmail ?? usage.invitedUsername ?? usage.invitedUserId}
          </button>
        ) : (
          usage.invitedEmail ?? usage.invitedUsername ?? usage.invitedUserId ?? "-"
        ),
        createdAt: formatDateTime(usage.createdAt),
        profileCompleted: renderYesNo(usage.profileCompleted),
        insightsCompletedCount:
          usage.insightsCompletedCount === null || usage.insightsCompletedCount === undefined
            ? "-"
            : formatNumber(usage.insightsCompletedCount),
        hasMoment: renderYesNo(usage.hasMoment),
        primaryActivity: (
          <Badge tone={usage.primaryActivity && usage.primaryActivity !== "NONE" ? "accent" : "neutral"} size="sm">
            {resolvePrimaryActivityLabel(usage.primaryActivity)}
          </Badge>
        ),
        ip: usage.ip ?? "-",
      })),
    [usageResponse, openUserModal]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Referrals"
        subtitle="Monitor referral codes and their usage."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-subtle">
            Total referral codes: {formatNumber(codesResponse?.totalElements ?? 0)}
          </p>
          {queryFilter ? (
            <Badge tone="accent" size="sm">
              Filter: {queryFilter}
            </Badge>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <form
          className="grid gap-3 lg:grid-cols-[1fr,auto,auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setSelectedCode(null);
            setUsagePage(0);
            setPage(0);
            const trimmed = query.trim();
            setQueryFilter(trimmed.length ? trimmed : null);
          }}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by code, email, or username"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setQuery("");
              setSelectedCode(null);
              setUsagePage(0);
              setPage(0);
              setQueryFilter(null);
            }}
          >
            Reset
          </Button>
        </form>
      </Card>

      {selectedCode ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Code details: {selectedCode}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedCode(null)}>
              Close details
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
                <span className="font-semibold text-foreground">Created at:</span>{" "}
                {formatDateTime(detail.createdAt)}
              </p>
            </div>
          ) : null}

          {detail ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/60 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Invited</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatNumber(detail.invitedCount)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/60 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Onboarding</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatNumber(detail.onboardingCompletedCount)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/60 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Profile</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatNumber(detail.profileCompletedCount)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/60 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Insights</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatNumber(detail.insightsCompletedCount)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/60 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  Moment / activity
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {formatNumber(detail.momentOrActivityCount)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Code usage</h3>
              <p className="text-xs text-subtle">
                Total: {formatNumber(usageResponse?.totalElements ?? 0)}
              </p>
            </div>

            <AdminTable
              columns={[
                { key: "invited", label: "Invited user" },
                { key: "createdAt", label: "Used at" },
                { key: "profileCompleted", label: "Profile (exists)" },
                { key: "insightsCompletedCount", label: "Insights" },
                { key: "hasMoment", label: "Moment" },
                { key: "primaryActivity", label: "Activity" },
                { key: "ip", label: "IP" },
              ]}
              rows={usageRows}
              emptyLabel="No usage found"
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUsagePage((current) => Math.max(0, current - 1))}
                disabled={(usageResponse?.number ?? 0) <= 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUsagePage((current) => current + 1)}
                disabled={Boolean(usageResponse?.last ?? true)}
              >
                Next
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
              ? "Loading referrals..."
              : detailLoading
                ? "Loading referral details..."
                : "Loading referral usage..."}
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Unable to load referrals</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadCodes()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "code", label: "Code" },
              { key: "owner", label: "Owner" },
              { key: "usesCount", label: "Uses" },
              { key: "createdAt", label: "Created at" },
              { key: "actions", label: "Actions", align: "right" },
            ]}
            rows={codeRows}
            emptyLabel="No referrals found"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              Page {(codesResponse?.number ?? 0) + 1} of {Math.max(codesResponse?.totalPages ?? 1, 1)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={(codesResponse?.number ?? 0) <= 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={Boolean(codesResponse?.last ?? true)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Modal
        open={userModalOpen}
        title="User progress details"
        description={selectedInvitedUserId ? `UserId: ${selectedInvitedUserId}` : undefined}
        onClose={() => setUserModalOpen(false)}
        secondaryAction={{
          label: "Close",
          variant: "outline",
          onClick: () => setUserModalOpen(false),
        }}
      >
        {userLoading ? (
          <div className="flex items-center gap-3">
            <Loader size="sm" />
            <p className="text-sm text-muted">Loading user details...</p>
          </div>
        ) : userModalError ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-danger">Unable to load user</p>
            <p className="text-sm text-muted">{userModalError.message}</p>
          </div>
        ) : (
          <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {userDetail?.email ?? "Unknown email"}
                  </p>
                  <p className="text-xs text-subtle">
                    {userDetail?.username ? `@${userDetail.username}` : "No username"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge tone="neutral" size="sm">
                    Status: {userDetail?.status ?? "-"}
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    Lang: {userDetail?.language ?? "-"}
                  </Badge>
                  <Badge tone={userDetail?.onboardingCompleted ? "success-light" : "neutral"} size="sm">
                    Onboarding: {userDetail?.onboardingCompleted ? "Yes" : "No"}
                  </Badge>
                  <Badge tone={userProfile ? "success-light" : "neutral"} size="sm">
                    Profile record: {userProfile ? "Yes" : "No"}
                  </Badge>
                  <Badge tone={userProfile?.avatarUrl ? "success-light" : "neutral"} size="sm">
                    Avatar: {userProfile?.avatarUrl ? "Yes" : "No"}
                  </Badge>
                  <Badge tone={userTestsCount && userTestsCount > 0 ? "accent" : "neutral"} size="sm">
                    Insights: {userTestsCount === null ? "-" : formatNumber(userTestsCount)}
                  </Badge>
                </div>
              </div>

              {userProfile ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent" size="sm">
                    Fields filled: {formatNumber(profileFieldsStats.filled)}/{formatNumber(profileFieldsStats.total)}
                  </Badge>
                  <Badge tone={profileFieldsStats.missing > 0 ? "warning" : "success-light"} size="sm">
                    Missing: {formatNumber(profileFieldsStats.missing)}
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-subtle">
                  This user does not have a profile record yet.
                </p>
              )}
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Profile fields</p>
                  <p className="text-xs text-subtle">
                    {userProfile ? "Default view shows missing fields only." : "No profile fields available."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProfileFieldsOpen((current) => !current)}
                  disabled={!userProfile}
                >
                  {profileFieldsOpen ? "Hide fields" : "Show fields"}
                </Button>
              </div>

              {profileFieldsOpen && userProfile ? (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={profileFieldsFilter === "missing" ? "secondary" : "outline"}
                      onClick={() => setProfileFieldsFilter("missing")}
                    >
                      Missing
                    </Button>
                    <Button
                      size="sm"
                      variant={profileFieldsFilter === "filled" ? "secondary" : "outline"}
                      onClick={() => setProfileFieldsFilter("filled")}
                    >
                      Filled
                    </Button>
                    <Button
                      size="sm"
                      variant={profileFieldsFilter === "all" ? "secondary" : "outline"}
                      onClick={() => setProfileFieldsFilter("all")}
                    >
                      All
                    </Button>
                    <p className="text-xs text-subtle">
                      Showing {formatNumber(filteredProfileFields.length)} field(s)
                    </p>
                  </div>

                  <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                    {filteredProfileFields.length ? (
                      filteredProfileFields.map((field) => (
                        <div
                          key={field.label}
                          className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface/80 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                              {field.label}
                            </p>
                            <p
                              className="mt-0.5 truncate text-sm text-foreground"
                              title={typeof field.value === "string" ? field.value : undefined}
                            >
                              {field.value ?? "-"}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {field.filled ? (
                              <Badge tone="success-light" size="sm">
                                Filled
                              </Badge>
                            ) : (
                              <Badge tone="neutral" size="sm">
                                Missing
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted">No fields to show.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
