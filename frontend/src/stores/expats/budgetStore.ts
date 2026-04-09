"use client";

import { createStore } from "../utils/createStore";
import { readStorage, writeStorage } from "../utils/storage";
import type {
  BudgetSimulationResponse,
  BudgetTrackingResponse,
  StarterKitResponse,
  MicroTestNextResponse,
  RiskSnapshotResponse,
  CreateBudgetSimulationRequest,
  CreateBudgetTrackingRequest,
  GenerateStarterKitRequest,
  MicroTestSubmitRequest,
} from "../../types/expats";
import {
  runBudgetSimulation,
  getBudgetSimulations,
  createBudgetTracking,
  getBudgetTracking,
  generateStarterKit,
  getLatestStarterKit,
  getNextMicroTest,
  submitMicroTestBlock,
  getRiskIndicators,
} from "../../services/expats";

export const BUDGET_ACTIVE_SIMULATION_STORAGE_KEY = "syncro.expats.budget.activeSimulation";
export const BUDGET_FORM_STATE_STORAGE_KEY = "syncro.expats.budget.formState";

const readActiveSimulation = (): BudgetSimulationResponse | null =>
  readStorage<BudgetSimulationResponse | null>(BUDGET_ACTIVE_SIMULATION_STORAGE_KEY, null);

const writeActiveSimulation = (simulation: BudgetSimulationResponse | null): void => {
  writeStorage(BUDGET_ACTIVE_SIMULATION_STORAGE_KEY, simulation);
};

const resolveActiveSimulation = (
  simulations: BudgetSimulationResponse[],
  currentActive: BudgetSimulationResponse | null
): BudgetSimulationResponse | null => {
  if (currentActive) {
    const synced = simulations.find((simulation) => simulation.id === currentActive.id) ?? currentActive;
    writeActiveSimulation(synced);
    return synced;
  }

  const fallback = simulations[0] ?? null;
  writeActiveSimulation(fallback);
  return fallback;
};

const isHttpStatus = (error: unknown, status: number): boolean =>
  typeof error === "object" &&
  error !== null &&
  "response" in error &&
  typeof error.response === "object" &&
  error.response !== null &&
  "status" in error.response &&
  error.response.status === status;

// ─── State ───────────────────────────────────────────────────────────────────

export interface BudgetStoreState extends Record<string, unknown> {
  status: "idle" | "loading" | "error";
  error: string | null;

  // Budget Simulation
  simulations: BudgetSimulationResponse[];
  latestSimulation: BudgetSimulationResponse | null;
  activeSimulation: BudgetSimulationResponse | null;

  // Budget Tracking
  trackingEntries: BudgetTrackingResponse[];

  // Starter Kit
  starterKit: StarterKitResponse | null;

  // Micro-test
  microTestNext: MicroTestNextResponse | null;

  // Risk
  riskSnapshot: RiskSnapshotResponse | null;
}

export const createBudgetStoreState = (): BudgetStoreState => ({
  status: "idle",
  error: null,
  simulations: [],
  latestSimulation: null,
  activeSimulation: readActiveSimulation(),
  trackingEntries: [],
  starterKit: null,
  microTestNext: null,
  riskSnapshot: null,
});

export const budgetStore = createStore<BudgetStoreState>(createBudgetStoreState());

export const resetBudgetStore = () => {
  budgetStore.setState(createBudgetStoreState(), true);
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export const budgetActions = {
  // ── Budget Simulation ────────────────────────────────────────────────────

  runSimulation: async (payload: CreateBudgetSimulationRequest): Promise<BudgetSimulationResponse> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const result = await runBudgetSimulation(payload);
      writeActiveSimulation(result);
      budgetStore.setState((s) => ({
        status: "idle",
        latestSimulation: result,
        activeSimulation: result,
        simulations: [result, ...s.simulations.filter((simulation) => simulation.id !== result.id)],
      }));
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Simulation failed";
      budgetStore.setState({ status: "error", error: msg });
      throw e;
    }
  },

  loadSimulations: async (): Promise<void> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const simulations = await getBudgetSimulations();
      const activeSimulation = resolveActiveSimulation(
        simulations,
        budgetStore.getState().activeSimulation
      );
      budgetStore.setState({
        status: "idle",
        simulations,
        latestSimulation: simulations[0] ?? null,
        activeSimulation,
      });
    } catch (e: unknown) {
      // 403 = anonymous user, not an error — just no history
      if (isHttpStatus(e, 403)) {
        budgetStore.setState({ status: "idle", simulations: [], latestSimulation: null });
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to load simulations";
      budgetStore.setState({ status: "error", error: msg });
      throw e;
    }
  },

  // ── Budget Tracking ──────────────────────────────────────────────────────

  createTrackingEntry: async (payload: CreateBudgetTrackingRequest): Promise<BudgetTrackingResponse> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const entry = await createBudgetTracking(payload);
      budgetStore.setState((s) => ({
        status: "idle",
        trackingEntries: [entry, ...s.trackingEntries],
      }));
      return entry;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create tracking entry";
      budgetStore.setState({ status: "error", error: msg });
      throw e;
    }
  },

  loadTrackingEntries: async (): Promise<void> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const entries = await getBudgetTracking();
      budgetStore.setState({ status: "idle", trackingEntries: entries });
    } catch (e: unknown) {
      // 403 = anonymous user, not an error — just no tracking
      if (isHttpStatus(e, 403)) {
        budgetStore.setState({ status: "idle", trackingEntries: [] });
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to load tracking";
      budgetStore.setState({ status: "error", error: msg });
      throw e;
    }
  },

  // ── Starter Kit ──────────────────────────────────────────────────────────

  generateKit: async (payload?: GenerateStarterKitRequest): Promise<StarterKitResponse> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const kit = await generateStarterKit(payload);
      budgetStore.setState({ status: "idle", starterKit: kit });
      return kit;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate starter kit";
      budgetStore.setState({ status: "error", error: msg });
      throw e;
    }
  },

  loadLatestKit: async (): Promise<void> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const kit = await getLatestStarterKit();
      budgetStore.setState({ status: "idle", starterKit: kit });
    } catch {
      // 404 = no kit generated yet, treat as empty
      budgetStore.setState({ status: "idle", starterKit: null });
    }
  },

  // ── Micro-test ───────────────────────────────────────────────────────────

  loadNextMicroTest: async (): Promise<void> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const next = await getNextMicroTest();
      budgetStore.setState({ status: "idle", microTestNext: next });
    } catch {
      // 404 = no test available, treat as empty
      budgetStore.setState({ status: "idle", microTestNext: null });
    }
  },

  submitMicroTest: async (assignmentId: string, payload: MicroTestSubmitRequest): Promise<void> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      await submitMicroTestBlock(assignmentId, payload);
      budgetStore.setState({ status: "idle", microTestNext: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to submit micro-test";
      budgetStore.setState({ status: "error", error: msg });
      throw e;
    }
  },

  // ── Risk Indicators ──────────────────────────────────────────────────────

  loadRiskIndicators: async (): Promise<void> => {
    budgetStore.setState({ status: "loading", error: null });
    try {
      const snapshot = await getRiskIndicators();
      budgetStore.setState({ status: "idle", riskSnapshot: snapshot });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load risk indicators";
      budgetStore.setState({ status: "error", error: msg });
      throw e;
    }
  },
};
