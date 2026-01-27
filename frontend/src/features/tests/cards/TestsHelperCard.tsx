"use client";

import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface TestsHelperCardProps
  extends HTMLAttributes<HTMLDivElement> {
  completedCount?: number | null;
  totalTests?: number;
  loading?: boolean;
}

const resolveProgressLabel = (
  completedCount: number | null | undefined,
  totalTests?: number
) => {
  if (!totalTests || totalTests <= 0) {
    return completedCount == null ? "Progressi in calcolo" : `${completedCount} completati`;
  }
  if (completedCount == null) {
    return `0 / ${totalTests} completati`;
  }
  return `${completedCount} / ${totalTests} completati`;
};

const resolveTitle = (completedCount: number | null | undefined) => {
  if (completedCount == null) return "Porta Zyra al massimo";
  if (completedCount === 0) return "Inizia con il primo micro-test";
  if (completedCount < 3) return "Affina il tuo profilo";
  return "Profilo in evoluzione";
};

const resolveDescription = (completedCount: number | null | undefined) => {
  if (completedCount == null) {
    return "Sto recuperando i tuoi progressi: tra poco sapremo dove migliorare.";
  }
  if (completedCount === 0) {
    return "I micro-test aiutano Zyra a capire chi sei e a proporti match più utili.";
  }
  if (completedCount < 3) {
    return "Ogni test aggiunge segnali preziosi: bastano pochi minuti per fare la differenza.";
  }
  return "Ottimo lavoro: continua a completare test per rendere i match sempre più precisi.";
};

export const TestsHelperCard = ({
  className,
  completedCount,
  totalTests,
  loading,
  ...props
}: TestsHelperCardProps) => {
  const progressLabel = useMemo(
    () => resolveProgressLabel(completedCount, totalTests),
    [completedCount, totalTests]
  );
  const title = resolveTitle(completedCount);
  const description = resolveDescription(completedCount);

  return (
    <Card
      className={cx(
        "relative overflow-hidden border border-border/70 bg-surface p-5",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_65%)]" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              Guida ai test
            </p>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>
          <span className="rounded-full bg-qa-tests-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--qa-tests-gradient-start)]">
            {loading ? "..." : progressLabel}
          </span>
        </div>

        <p className="text-sm text-muted">{description}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Cosa ottieni",
              value: "Match più precisi",
            },
            {
              label: "Durata media",
              value: "2-3 minuti",
            },
            {
              label: "Flessibilità",
              value: "Quando vuoi",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--radius-md)] border border-border/60 bg-surface-muted/60 p-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-subtle">
          Zyra aggiorna il profilo dopo ogni test completato.
        </p>
      </div>
    </Card>
  );
};
