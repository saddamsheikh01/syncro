"use client";

import type { HTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "@/lib/classNames";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { useT } from "@/hooks";

export type ZyraMessageRole = "zyra" | "user";

export interface ZyraMessageBubbleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  message: string;
  sender?: ZyraMessageRole;
  timestamp?: string;
  statusLabel?: string;
}

export const ZyraMessageBubble = ({
  className,
  message,
  sender = "zyra",
  timestamp,
  statusLabel,
  ...props
}: ZyraMessageBubbleProps) => {
  const { t } = useT();
  const isUser = sender === "user";

  return (
    <div
      className={cx(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      <div
        className={cx(
          "max-w-[80%] space-y-2 rounded-[var(--radius-lg)] border px-4 py-3 text-sm shadow-sm",
          isUser
            ? "border-accent/20 bg-accent text-accent-contrast"
            : "border-border bg-card text-foreground"
        )}
      >
        {!isUser ? (
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zyra-text">
            <ZyraMark size="xs" glow={false} />
            <span>{t("Zyra")}</span>
          </div>
        ) : null}
        <div className="space-y-2 text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: (props) => (
                <p className="text-inherit" {...props} />
              ),
              ul: (props) => (
                <ul className="list-disc space-y-1 pl-4 text-inherit" {...props} />
              ),
              ol: (props) => (
                <ol className="list-decimal space-y-1 pl-4 text-inherit" {...props} />
              ),
              li: (props) => (
                <li className="text-inherit" {...props} />
              ),
              a: (props) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noreferrer"
                  className="text-inherit underline decoration-current/40 transition hover:decoration-current"
                />
              ),
              strong: (props) => (
                <strong className="font-semibold text-inherit" {...props} />
              ),
              em: (props) => (
                <em className="italic text-inherit" {...props} />
              ),
              blockquote: (props) => (
                <blockquote
                  className={cx(
                    "border-l-2 pl-3 text-inherit",
                    isUser ? "border-white/40" : "border-border-strong"
                  )}
                  {...props}
                />
              ),
              code: (props) => {
                const { className, ...rest } = props;
                const isInline = !className;
                return (
                  <code
                    className={cx(
                      "rounded px-1.5 py-0.5 font-mono text-[12px]",
                      isInline
                        ? isUser
                          ? "bg-white/20"
                          : "bg-surface-muted"
                        : "block whitespace-pre-wrap",
                      className
                    )}
                    {...rest}
                  />
                );
              },
              pre: (props) => (
                <pre
                  className={cx(
                    "overflow-x-auto rounded-[var(--radius-md)] p-3 text-[12px]",
                    isUser ? "bg-white/10 text-accent-contrast" : "bg-surface-muted"
                  )}
                  {...props}
                />
              ),
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
        {timestamp || statusLabel ? (
          <div
            className={cx(
              "flex items-center justify-between text-[11px]",
              isUser ? "text-accent-contrast/80" : "text-subtle"
            )}
          >
            <span>{timestamp}</span>
            {statusLabel ? <span>{statusLabel}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
