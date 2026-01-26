"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { useZyra } from "@/hooks";
import { cx } from "@/lib/classNames";

const ArrowIcon = () => (
  <svg
    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const ZyraTipCard = () => {
  const { suggestions, loadingSuggestions, actions } = useZyra();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchSuggestions({ size: 1 }).catch(() => undefined);
  }, [actions]);

  const suggestion = suggestions[0];

  if (loadingSuggestions && !suggestion) {
    return (
      <div className="zyra-surface-soft flex items-center gap-3 rounded-[var(--radius-lg)] border border-zyra-border/50 p-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-zyra-glow" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 animate-pulse rounded bg-zyra-glow" />
          <div className="h-3 w-full animate-pulse rounded bg-zyra-glow" />
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  const message =
    typeof suggestion.payload?.message === "string"
      ? suggestion.payload.message
      : "Ho un suggerimento per te oggi.";

  return (
    <Link
      href="/zyra"
      className={cx(
        "zyra-surface-soft group flex items-start gap-3 rounded-[var(--radius-lg)] border border-zyra-border/50 p-3 transition-all duration-300",
        "hover:border-zyra-border hover:shadow-[0_8px_20px_var(--zyra-glow)]"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zyra-border/40 bg-white/80 shadow-sm">
        <ZyraMark size="xs" glow={false} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zyra-text">
            Suggerimento Zyra
          </p>
          <ArrowIcon />
        </div>
        <div className="line-clamp-2 text-xs text-muted">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: (props) => <span {...props} />,
              strong: (props) => <strong className="font-semibold" {...props} />,
              em: (props) => <em className="italic" {...props} />,
              ul: (props) => <span {...props} />,
              ol: (props) => <span {...props} />,
              li: (props) => (
                <span className="after:content-[' ']" {...props}>
                  • {props.children}
                </span>
              ),
              a: (props) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-current/40 hover:decoration-current"
                />
              ),
              code: (props) => (
                <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[11px]" {...props} />
              ),
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
      </div>
    </Link>
  );
};
