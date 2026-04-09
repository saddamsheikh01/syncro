"use client";

import { useCallback } from "react";
import { useBudgetStore } from "../../stores/expats/useBudgetStore";
import { budgetActions } from "../../stores/expats/budgetStore";
import type { CreateBudgetSimulationRequest, CreateBudgetTrackingRequest } from "../../types/expats";

export const useBudget = () => {
  const status = useBudgetStore((s) => s.status);
  const error = useBudgetStore((s) => s.error);
  const simulations = useBudgetStore((s) => s.simulations);
  const latestSimulation = useBudgetStore((s) => s.latestSimulation);
  const activeSimulation = useBudgetStore((s) => s.activeSimulation);
  const trackingEntries = useBudgetStore((s) => s.trackingEntries);

  const isLoading = status === "loading";

  const runSimulation = useCallback(
    (payload: CreateBudgetSimulationRequest) => budgetActions.runSimulation(payload),
    []
  );

  const loadSimulations = useCallback(() => budgetActions.loadSimulations(), []);

  const createTrackingEntry = useCallback(
    (payload: CreateBudgetTrackingRequest) => budgetActions.createTrackingEntry(payload),
    []
  );

  const loadTrackingEntries = useCallback(() => budgetActions.loadTrackingEntries(), []);

  return {
    status,
    error,
    isLoading,
    simulations,
    latestSimulation,
    activeSimulation,
    trackingEntries,
    runSimulation,
    loadSimulations,
    createTrackingEntry,
    loadTrackingEntries,
  };
};
