"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { TestCountCard } from "@/components/ui/TestCountCard";
import { useTests } from "@/hooks";

const resolveCtaLabel = (count: number | null | undefined) => {
  if (count == null || count === 0) return "Inizia ora";
  if (count < 3) return "Completa un altro";
  return "Aggiorna il profilo";
};

const resolveDescription = (count: number | null | undefined) => {
  if (count == null) return "Sto calcolando i tuoi micro-test completati.";
  if (count === 0) {
    return "Sblocca subito il profilo Zyra completando il primo test.";
  }
  if (count < 3) {
    return "Ogni test migliora la precisione dei tuoi match.";
  }
  return "Continua cosi: Zyra sta raffinando il tuo profilo.";
};

export const TestsEncouragementCard = () => {
  const router = useRouter();
  const { completedCount, countLoading, actions } = useTests();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchCompletedCount().catch(() => undefined);
  }, [actions]);

  return (
    <TestCountCard
      title="I tuoi test"
      count={completedCount}
      loading={countLoading}
      description={resolveDescription(completedCount)}
      action={
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          onClick={() => router.push("/tests")}
        >
          {resolveCtaLabel(completedCount)}
        </Button>
      }
      variant="compact"
    />
  );
};
