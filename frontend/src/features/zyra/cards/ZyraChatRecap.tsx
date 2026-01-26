"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { NavIcon } from "@/components/ui/NavIcon";
import { cx } from "@/lib/classNames";
import { getChatRecap } from "@/services/zyra";
import type { ZyraChatRecapResponse } from "@/types/zyra";

export interface ZyraChatRecapProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: string;
}

export const ZyraChatRecap = ({
  className,
  title = "Riepilogo conversazioni",
  ...props
}: ZyraChatRecapProps) => {
  const [data, setData] = useState<ZyraChatRecapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const fetchRecap = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getChatRecap();
      setData(response);
    } catch {
      setError("Impossibile generare il riepilogo. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchRecap();
  }, []);

  return (
    <div
      className={cx(
        "zyra-surface relative overflow-hidden rounded-[var(--radius-xl)] border border-zyra-border p-5 shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ZyraMark size="sm" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zyra-text">
                Zyra AI
              </p>
              <p className="text-xs text-subtle">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && data.conversationCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full border border-zyra-border/60 bg-zyra-surface-soft px-2.5 py-1 text-[10px] font-semibold text-zyra-text">
                <NavIcon name="chat" className="h-3 w-3" />
                {data.conversationCount}
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[80px]">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-subtle">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zyra-text border-t-transparent" />
              <span className="text-sm">
                Zyra sta analizzando le tue chat...
              </span>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-danger">{error}</p>
              <Button size="sm" variant="secondary" onClick={fetchRecap}>
                Riprova
              </Button>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="space-y-2 text-sm leading-relaxed text-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: (props) => <p className="text-inherit" {...props} />,
                    ul: (props) => (
                      <ul className="list-disc space-y-1 pl-4 text-inherit" {...props} />
                    ),
                    ol: (props) => (
                      <ol className="list-decimal space-y-1 pl-4 text-inherit" {...props} />
                    ),
                    li: (props) => <li className="text-inherit" {...props} />,
                    a: (props) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-current/40 transition hover:decoration-current"
                      />
                    ),
                    strong: (props) => <strong className="font-semibold" {...props} />,
                    em: (props) => <em className="italic" {...props} />,
                    blockquote: (props) => (
                      <blockquote className="border-l-2 border-border-strong pl-3 text-inherit" {...props} />
                    ),
                    code: (props) => (
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[12px]" {...props} />
                    ),
                    pre: (props) => (
                      <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-surface-muted p-3 text-[12px]" {...props} />
                    ),
                  }}
                >
                  {data.recap}
                </ReactMarkdown>
              </div>

              {/* Recent contacts */}
              {data.recentContacts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                    Contatti recenti
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {data.recentContacts.slice(0, 5).map((name, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1.5"
                      >
                        <Avatar name={name} size="sm" />
                        <span className="text-xs font-medium text-foreground">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && data ? (
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <p className="text-[10px] text-subtle">
              Generato da Zyra in base alle tue conversazioni
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchRecap}
              className="text-zyra-text hover:bg-zyra-surface-soft"
            >
              Aggiorna
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
