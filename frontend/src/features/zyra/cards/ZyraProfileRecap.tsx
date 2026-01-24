"use client";

import { useCallback, useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { cx } from "@/lib/classNames";
import { getProfileRecap, getProfileRecapForUser } from "@/services/zyra";

export interface ZyraProfileRecapProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  userId?: string;
}

export const ZyraProfileRecap = ({
  className,
  title = "Il tuo profilo secondo Zyra",
  userId,
  ...props
}: ZyraProfileRecapProps) => {
  const [recap, setRecap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = userId
        ? await getProfileRecapForUser(userId)
        : await getProfileRecap();
      setRecap(response.recap);
    } catch {
      setError("Impossibile generare il riepilogo. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
                {userId
                  ? "Zyra sta analizzando questo profilo..."
                  : "Zyra sta analizzando il tuo profilo..."}
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
            <p className="text-sm leading-relaxed text-foreground">{recap}</p>
          ) : null}
        </div>

        {!loading && !error && recap ? (
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <p className="text-[10px] text-subtle">
              {userId
                ? "Generato da Zyra in base al profilo"
                : "Generato da Zyra in base al tuo profilo"}
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
