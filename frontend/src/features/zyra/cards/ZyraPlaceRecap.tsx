"use client";

import { useCallback, useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/buttons/Button";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { cx } from "@/lib/classNames";
import { getPlaceRecap } from "@/services/zyra";

export interface ZyraPlaceRecapProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  placeId: string;
  title?: string;
  placeName?: string;
}

export const ZyraPlaceRecap = ({
  className,
  placeId,
  title = "Perche questo luogo fa per te",
  placeName,
  ...props
}: ZyraPlaceRecapProps) => {
  const [recap, setRecap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecap = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getPlaceRecap(placeId);
      setRecap(response.recap);
    } catch {
      setError("Impossibile generare il riepilogo. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  return (
    <div
      className={cx(
        "zyra-surface relative overflow-hidden rounded-[var(--radius-lg)] border border-zyra-border p-5 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ZyraMark size="sm" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zyra-text">
                Zyra AI
              </p>
              <p className="text-xs text-subtle">{title}</p>
            </div>
          </div>
          <span className="rounded-full border border-zyra-border/60 bg-zyra-surface-soft px-2 py-0.5 text-[10px] font-semibold text-zyra-text">
            AI
          </span>
        </div>

        <div className="min-h-[60px]">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-subtle">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zyra-text border-t-transparent" />
              <span className="text-sm">
                {placeName
                  ? `Zyra sta analizzando ${placeName}...`
                  : "Zyra sta analizzando questo luogo..."}
              </span>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-danger">{error}</p>
              <Button size="sm" variant="secondary" onClick={fetchRecap}>
                Riprova
              </Button>
            </div>
          ) : recap ? (
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
                {recap}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>

        {!loading && !error && recap ? (
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <p className="text-[10px] text-subtle">
              Generato da Zyra in base al tuo profilo
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchRecap}
              className="text-zyra-text hover:bg-zyra-surface-soft"
            >
              Rigenera
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
