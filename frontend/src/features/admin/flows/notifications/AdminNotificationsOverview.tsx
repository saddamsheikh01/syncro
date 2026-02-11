"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
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
        setValidationError(requestError.message || "Invalid JSON data.");
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
        title="Custom notifications"
        subtitle="Send custom push notifications to one or more users."
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Create notification</h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            label="User IDs"
            value={userIdsRaw}
            onChange={(event) => setUserIdsRaw(event.target.value)}
            placeholder="UUIDs separated by comma, space, or newline"
            required
          />

          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />

          <Textarea
            label="Body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            placeholder="Optional text"
          />

          <Textarea
            label="JSON data"
            value={dataRaw}
            onChange={(event) => setDataRaw(event.target.value)}
            placeholder='{"source":"backoffice","priority":"high"}'
          />

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={saving} loadingText="Sending">
              Send notifications
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
              Reset form
            </Button>
          </div>
        </form>
      </Card>

      {validationError ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Validation error</p>
          <p className="text-sm text-muted">{validationError}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Notification send error</p>
          <p className="text-sm text-muted">{error.message}</p>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm text-subtle">
          Last send: {formatNumber(createdNotifications.length)} notifications created
        </p>
      </Card>

      <AdminTable
        columns={[
          { key: "idShort", label: "Notification ID" },
          { key: "userId", label: "User ID" },
          { key: "title", label: "Title" },
          { key: "type", label: "Type" },
          { key: "createdAt", label: "Created at" },
        ]}
        rows={rows}
        emptyLabel="No notifications sent in this session"
      />
    </div>
  );
};
