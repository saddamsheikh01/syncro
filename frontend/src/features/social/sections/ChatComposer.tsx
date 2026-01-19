"use client";

import { useState, type HTMLAttributes, type FormEvent } from "react";
import { Button } from "@/components/buttons/Button";
import { Textarea } from "@/components/elements/Textarea";
import { cx } from "@/lib/classNames";

export interface ChatComposerProps
  extends Omit<HTMLAttributes<HTMLFormElement>, "title" | "onSubmit"> {
  placeholder?: string;
  primaryActionLabel?: string;
  helper?: string;
  loading?: boolean;
  disabled?: boolean;
  onSend: (content: string) => void | Promise<void>;
}

export const ChatComposer = ({
  className,
  placeholder = "Scrivi un messaggio...",
  primaryActionLabel = "Invia",
  helper,
  loading = false,
  disabled = false,
  onSend,
  ...props
}: ChatComposerProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || loading || disabled) return;

    await onSend(trimmed);
    setContent("");
  };

  const isDisabled = loading || disabled || !content.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        "space-y-3 rounded-[var(--radius-lg)] border border-border/60 bg-card p-4 shadow-sm",
        className
      )}
      {...props}
    >
      <Textarea
        placeholder={placeholder}
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading || disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <div className="flex items-center justify-end">
        <Button size="sm" type="submit" disabled={isDisabled} loading={loading}>
          {primaryActionLabel}
        </Button>
      </div>
      {helper ? <p className="text-xs text-subtle">{helper}</p> : null}
    </form>
  );
};
