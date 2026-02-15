"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import { createCustomNotifications } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { NotificationResponse } from "@/types/admin";
import type { Uuid } from "@/types/shared";

const parseUserIds = (value: string): Uuid[] =>
  value
    .split(/[\n,;\s]+/g)
    .map((part) => part.trim())
    .filter(Boolean);

const parseDataPayload = (value: string): Record<string, unknown> | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The data field must be a valid JSON object.");
  }

  return parsed as Record<string, unknown>;
};

const isApiError = (value: unknown): value is ApiError => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.code === "string" &&
    typeof record.status === "number" &&
    typeof record.message === "string"
  );
};

export const AdminNotificationsOverview = () => {
  const { t } = useT();

  const [userIdsRaw, setUserIdsRaw] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dataRaw, setDataRaw] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdNotifications, setCreatedNotifications] = useState<NotificationResponse[]>([]);

  const rows = useMemo(
    () =>
      createdNotifications.map((notification) => ({
        id: notification.id,
        idShort: notification.id,
        userId: notification.userId,
        title: notification.title,
        type: notification.type,
        createdAt: formatDateTime(notification.createdAt),
      })),
    [createdNotifications]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setValidationError(null);

    try {
      const userIds = parseUserIds(userIdsRaw);
      if (!userIds.length) {
        setValidationError("Enter at least one valid userId.");
        return;
      }

      const data = parseDataPayload(dataRaw);
      const response = await createCustomNotifications({
        userIds,
        title: title.trim(),
        body: body.trim() || null,
        data,
      });

      setCreatedNotifications(response);
      setTitle("");
      setBody("");
      setDataRaw("");
    } catch (requestError) {
      if (
        requestError instanceof Error &&
        (!isApiError(requestError) ||
          requestError.message.includes("JSON") ||
          requestError.message.includes("Unexpected token"))
      ) {
        const message = requestError.message || "Invalid JSON data.";
        const normalized =
          message.includes("Unexpected token") ||
          message.includes("JSON") ||
          message.includes("Unexpected end of JSON input")
            ? "Invalid JSON data."
            : message;
        setValidationError(normalized);
        return;
      }

      if (isApiError(requestError)) {
        setError(requestError);
      } else {
        setError({
          code: "UNKNOWN",
          status: 0,
          message: "Unexpected error while sending notifications.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Custom notifications")}
        subtitle={t("Send custom push notifications to one or more users.")}
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Create notification")}
        </h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            label={t("User IDs")}
            value={userIdsRaw}
            onChange={(event) => setUserIdsRaw(event.target.value)}
            placeholder={t("UUIDs separated by comma, space, or newline")}
            required
          />

          <Input
            label={t("Title")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />

          <Textarea
            label={t("Body")}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            placeholder={t("Optional text")}
          />

          <Textarea
            label={t("JSON data")}
            value={dataRaw}
            onChange={(event) => setDataRaw(event.target.value)}
            placeholder={t('{"source":"backoffice","priority":"high"}')}
          />

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              loading={saving}
              loadingText={t("Sending")}
            >
              {t("Send notifications")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setUserIdsRaw("");
                setTitle("");
                setBody("");
                setDataRaw("");
                setValidationError(null);
              }}
            >
              {t("Reset form")}
            </Button>
          </div>
        </form>
      </Card>

      {validationError ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">
            {t("Validation error")}
          </p>
          <p className="text-sm text-muted">{t(validationError)}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">
            {t("Notification send error")}
          </p>
          <p className="text-sm text-muted">{t(error.message)}</p>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm text-subtle">
          {t("Last send: {count} notifications created", {
            count: formatNumber(createdNotifications.length),
          })}
        </p>
      </Card>

      <AdminTable
        columns={[
          { key: "idShort", label: t("Notification ID") },
          { key: "userId", label: t("User ID") },
          { key: "title", label: t("Title") },
          { key: "type", label: t("Type") },
          { key: "createdAt", label: t("Created at") },
        ]}
        rows={rows}
        emptyLabel={t("No notifications sent in this session")}
      />
    </div>
  );
};
