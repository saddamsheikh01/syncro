"use client";

import { useState, useRef, type HTMLAttributes, type FormEvent } from "react";
import { cx } from "@/lib/classNames";

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path
      d="M22 2L11 13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 2L15 22L11 13L2 9L22 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface ChatComposerProps
  extends Omit<HTMLAttributes<HTMLFormElement>, "title" | "onSubmit"> {
  placeholder?: string;
  helper?: string;
  loading?: boolean;
  disabled?: boolean;
  onSend: (content: string) => void | Promise<void>;
}

export const ChatComposer = ({
  className,
  placeholder = "Write a message...",
  helper,
  loading = false,
  disabled = false,
  onSend,
  ...props
}: ChatComposerProps) => {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || loading || disabled) return;

    await onSend(trimmed);
    setContent("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const canSend = content.trim().length > 0 && !loading && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        "flex items-end gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20",
        className
      )}
      {...props}
    >
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={content}
        onChange={handleInput}
        disabled={loading || disabled}
        rows={1}
        className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none disabled:opacity-60"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />

      <button
        type="submit"
        disabled={!canSend}
        className={cx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          canSend
            ? "bg-accent text-white shadow-md hover:scale-105 hover:shadow-lg active:scale-95"
            : "bg-surface-muted text-subtle"
        )}
        aria-label="Send message"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <SendIcon />
        )}
      </button>

      {helper ? (
        <p className="absolute -bottom-5 left-0 text-xs text-subtle">{helper}</p>
      ) : null}
    </form>
  );
};
