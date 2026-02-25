"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Select } from "@/components/elements/Select";
import { Button } from "@/components/buttons/Button";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { submitSupportMessage } from "@/services/support";
import type { SupportCategory } from "@/types/support";
import type { ApiError } from "@/types/api";
import { useAuth, useT } from "@/hooks";

const isApiError = (value: unknown): value is ApiError =>
  Boolean(
    value &&
      typeof value === "object" &&
      "message" in value &&
      typeof (value as ApiError).message === "string"
  );

const CATEGORY_OPTIONS: { value: SupportCategory; labelKey: string }[] = [
  { value: "GENERAL", labelKey: "General" },
  { value: "BUG", labelKey: "Bug or issue" },
  { value: "FEATURE", labelKey: "Feature request" },
  { value: "ACCOUNT", labelKey: "Account" },
  { value: "OTHER", labelKey: "Other" },
];

const SUBJECT_MAX_LENGTH = 255;
const MESSAGE_MAX_LENGTH = 4000;

export const SupportOverview = () => {
  const { t } = useT();
  const { status } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportCategory | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = useCallback(() => {
    setSubject("");
    setMessage("");
    setCategory("");
    setSubmitError(null);
    setSubmitted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject) {
      setSubmitError(t("Please enter a subject."));
      return;
    }
    if (!trimmedMessage) {
      setSubmitError(t("Please enter your message."));
      return;
    }
    if (trimmedSubject.length > SUBJECT_MAX_LENGTH) {
      setSubmitError(t("Subject is too long."));
      return;
    }
    if (trimmedMessage.length > MESSAGE_MAX_LENGTH) {
      setSubmitError(t("Message is too long."));
      return;
    }

    setSubmitting(true);
    try {
      await submitSupportMessage({
        subject: trimmedSubject,
        message: trimmedMessage,
        category: category || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const message = isApiError(err)
        ? (err as ApiError).message
        : t("Unable to send your message. Please try again.");
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="space-y-4">
        <SectionHeader
          title={t("Support")}
          subtitle={t("Your message goes to the Syncro support inbox in the back office.")}
        />
        <Card className="p-6">
          <p className="text-sm text-muted">
            {t("Please sign in to send a support message.")}
          </p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title={t("Support")}
          subtitle={t("Your message goes to the Syncro support inbox in the back office.")}
        />
        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-sm font-medium text-success">
              {t("Your message has been sent to the support inbox. It will be reviewed by our team shortly.")}
            </p>
            <Button variant="secondary" onClick={resetForm}>
              {t("Send another message")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("Support")}
        subtitle={t("Your message goes to the Syncro support inbox in the back office and is reviewed by our team.")}
      />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t("Subject")}
            placeholder={t("Brief summary of your question or issue")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={SUBJECT_MAX_LENGTH}
            required
            disabled={submitting}
          />
          <Select
            label={t("Category")}
            placeholder={t("Select a category (optional)")}
            options={[
              { value: "", label: t("None") },
              ...CATEGORY_OPTIONS.map((opt) => ({
                value: opt.value,
                label: t(opt.labelKey),
              })),
            ]}
            value={category}
            onValueChange={(v) => setCategory(v as SupportCategory)}
            disabled={submitting}
          />
          <Textarea
            label={t("Message")}
            placeholder={t("Describe your question or issue in detail...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MESSAGE_MAX_LENGTH}
            required
            disabled={submitting}
            rows={6}
            hint={t("{count} characters max", { count: MESSAGE_MAX_LENGTH })}
          />
          {submitError ? (
            <p className="text-sm text-danger">{submitError}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              loading={submitting}
              loadingText={t("Sending...")}
              disabled={submitting}
            >
              {t("Send message")}
            </Button>
            <p className="text-xs text-muted">
              {t("We usually process support requests as soon as possible.")}
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};
