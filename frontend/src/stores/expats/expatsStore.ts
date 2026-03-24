"use client";

import { createStore } from "../utils/createStore";
import type {
  AnonymousSession,
  ActivationStateResponse,
  FunnelAnswers,
  OnboardingResponse,
  ScoringResultResponse,
  SnapshotResponse,
} from "../../types/expats";
import {
  createSession,
  getSession,
  saveAnswer,
  convertSession,
  getActivationState,
  getOnboarding,
  getOnboardingStatus,
  patchOnboarding,
  createSnapshot,
  computeScoring,
  getScoringHistory,
} from "../../services/expats";

const SESSION_ID_KEY = "expats.session.id";
const SESSION_TOKEN_KEY = "expats.session.token";

export interface ExpatsState extends Record<string, unknown> {
  status: "idle" | "loading" | "error";
  error: string | null;

  // Funnel
  session: AnonymousSession | null;
  currentStep: number;
  funnelAnswers: FunnelAnswers;

  // Post-auth
  onboarding: OnboardingResponse | null;
  activationState: ActivationStateResponse | null;
  snapshots: SnapshotResponse[];
  scoringResult: ScoringResultResponse | null;
}

const initialState: ExpatsState = {
  status: "idle",
  error: null,
  session: null,
  currentStep: 1,
  funnelAnswers: {},
  onboarding: null,
  activationState: null,
  snapshots: [],
  scoringResult: null,
};

export const expatsStore = createStore<ExpatsState>(initialState);

const getStoredSession = () => {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(SESSION_ID_KEY);
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  return id && token ? { id, token } : null;
};

const storeSession = (id: string, token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_ID_KEY, id);
  localStorage.setItem(SESSION_TOKEN_KEY, token);
};

export const clearStoredSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
};

// ─── Hydration: restore funnelAnswers from backend session.answers[] ──────────

function hydrateAnswersFromSession(session: AnonymousSession): FunnelAnswers {
  const answers: FunnelAnswers = {};
  if (!session.answers || session.answers.length === 0) return answers;

  for (const a of session.answers) {
    const v = a.answerValue as Record<string, unknown> | string | null;
    switch (a.questionKey) {
      case "user_phase":
        if (typeof v === "string") answers.userPhase = v as FunnelAnswers["userPhase"];
        break;
      case "city_selection":
        if (v && typeof v === "object") {
          if (v.currentCityName) answers.currentCityName = v.currentCityName as string;
          if (v.targetCityName) answers.targetCityName = v.targetCityName as string;
          if (v.currentCityId) answers.currentCityId = v.currentCityId as string;
          if (v.targetCityId) answers.targetCityId = v.targetCityId as string;
          if (v.targetType) answers.targetType = v.targetType as FunnelAnswers["targetType"];
        }
        break;
      case "relocation_time":
      case "time_living_there":
        if (typeof v === "string") answers.relocationTime = v;
        break;
      case "age_range":
        if (v && typeof v === "object") {
          if (v.ageRange) answers.ageRange = v.ageRange as string;
          if (v.gender) answers.gender = v.gender as string;
        } else if (typeof v === "string") {
          answers.ageRange = v;
        }
        break;
      case "relationship":
        if (v && typeof v === "object") {
          if (v.household) answers.household = v.household as FunnelAnswers["household"];
          if (v.hasPets !== undefined) answers.hasPets = v.hasPets as boolean;
          if (v.childrenCount !== undefined) answers.childrenCount = v.childrenCount as number;
          if (v.childrenAgeRange) answers.childrenAgeRange = v.childrenAgeRange as string;
        }
        break;
      case "motivation":
        if (typeof v === "string") answers.primaryGoal = v as FunnelAnswers["primaryGoal"];
        break;
      case "work_type":
        if (v && typeof v === "object") {
          if (v.workStatus) answers.workStatus = v.workStatus as FunnelAnswers["workStatus"];
          if (v.workStructure) answers.workStructure = v.workStructure as FunnelAnswers["workStructure"];
          if (v.isRemote !== undefined) answers.isRemote = v.isRemote as boolean;
        }
        break;
      case "budget":
        if (v && typeof v === "object") {
          if (v.monthlyBudget !== undefined) answers.monthlyBudget = v.monthlyBudget as number;
          if (v.desiredLifestyle) answers.desiredLifestyle = v.desiredLifestyle as FunnelAnswers["desiredLifestyle"];
        }
        break;
      case "need":
        if (typeof v === "string") answers.priorityProblem = v as FunnelAnswers["priorityProblem"];
        break;
      case "city_priority":
        if (typeof v === "string") answers.socialPriority = v;
        break;
    }
  }
  return answers;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export const expatsActions = {
  getStoredSessionToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SESSION_TOKEN_KEY);
  },

  initSession: async (): Promise<AnonymousSession> => {
    expatsStore.setState({ status: "loading", error: null });
    try {
      const stored = getStoredSession();
      if (stored) {
        const session = await getSession(stored.id);
        if (session.status === "IN_PROGRESS" || session.status === "COMPLETED") {
          const hydrated = hydrateAnswersFromSession(session);
          const existing = expatsStore.getState().funnelAnswers;
          expatsStore.setState({
            session,
            currentStep: session.currentStep,
            funnelAnswers: { ...hydrated, ...existing },
            status: "idle",
          });
          return session;
        }
      }

      const session = await createSession({
        metadata: {
          device: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      });
      storeSession(session.id, session.sessionToken);
      expatsStore.setState({ session, currentStep: 1, status: "idle" });
      return session;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to init session";
      expatsStore.setState({ status: "error", error: msg });
      throw e;
    }
  },

  saveStepAnswer: async (
    stepNumber: number,
    questionGroup: "CITY_FIT" | "POSITIONING" | "EXECUTION",
    questionKey: string,
    answerValue: unknown,
    localAnswerUpdate?: Partial<FunnelAnswers>
  ): Promise<void> => {
    const { session, funnelAnswers } = expatsStore.getState();
    if (!session) throw new Error("No active session");

    expatsStore.setState({ status: "loading" });
    try {
      const updated = await saveAnswer(session.id, {
        stepNumber,
        questionGroup,
        questionKey,
        answerValue,
      });
      expatsStore.setState({
        session: updated,
        currentStep: updated.currentStep,
        funnelAnswers: { ...funnelAnswers, ...localAnswerUpdate },
        status: "idle",
      });
    } catch (e) {
      expatsStore.setState({ status: "error", error: "Failed to save answer" });
      throw e;
    }
  },

  setLocalAnswer: (updates: Partial<FunnelAnswers>) => {
    const { funnelAnswers } = expatsStore.getState();
    expatsStore.setState({ funnelAnswers: { ...funnelAnswers, ...updates } });
  },

  goToStep: (step: number) => {
    expatsStore.setState({ currentStep: step });
  },

  convertSession: async (): Promise<void> => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return;
    try {
      await convertSession({ sessionToken: token });
      clearStoredSession();
    } catch {
      // Idempotent — ignore if already converted
    }
  },

  /**
   * Convert anonymous session + sync funnel answers to onboarding profile.
   * Call this after successful user registration or login.
   * Returns true if there was a pending session to convert.
   */
  convertAndSync: async (): Promise<boolean> => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return false;

    expatsStore.setState({ status: "loading" });
    try {
      await convertSession({ sessionToken: token });
      clearStoredSession();

      // Sync funnel answers to onboarding profile
      const { funnelAnswers } = expatsStore.getState();
      const userTypeMap: Record<string, string> = {
        planning_move: "planning_move",
        recently_moved: "chosen_city",
        already_there: "already_in_city",
      };
      const onboardingPayload: Parameters<typeof patchOnboarding>[0] = {};
      if (funnelAnswers.userPhase) {
        onboardingPayload.userType = (userTypeMap[funnelAnswers.userPhase] ?? funnelAnswers.userPhase) as Parameters<typeof patchOnboarding>[0]["userType"];
      }
      if (funnelAnswers.targetCityId) onboardingPayload.targetCityId = funnelAnswers.targetCityId;
      if (funnelAnswers.targetCityName) onboardingPayload.targetCityName = funnelAnswers.targetCityName;
      if (funnelAnswers.currentCityId) onboardingPayload.currentCityId = funnelAnswers.currentCityId;
      if (funnelAnswers.currentCityName) onboardingPayload.currentCityName = funnelAnswers.currentCityName;
      if (funnelAnswers.household) onboardingPayload.household = funnelAnswers.household;
      if (funnelAnswers.hasPets !== undefined) onboardingPayload.hasPets = funnelAnswers.hasPets;
      if (funnelAnswers.primaryGoal) onboardingPayload.primaryGoal = funnelAnswers.primaryGoal;
      if (funnelAnswers.workStatus) onboardingPayload.workStatus = funnelAnswers.workStatus;
      if (funnelAnswers.isRemote !== undefined) onboardingPayload.isRemote = funnelAnswers.isRemote;
      if (funnelAnswers.monthlyBudget) onboardingPayload.monthlyBudget = funnelAnswers.monthlyBudget;
      if (funnelAnswers.desiredLifestyle) onboardingPayload.desiredLifestyle = funnelAnswers.desiredLifestyle;
      if (funnelAnswers.priorityProblem) onboardingPayload.priorityProblem = funnelAnswers.priorityProblem;
      if (funnelAnswers.socialPriority) onboardingPayload.socialPriority = funnelAnswers.socialPriority;

      const fieldsCount = Object.keys(onboardingPayload).length;
      if (fieldsCount > 0) {
        onboardingPayload.completedSteps = fieldsCount;
        const onboarding = await patchOnboarding(onboardingPayload);
        expatsStore.setState({ onboarding, status: "idle" });
      } else {
        expatsStore.setState({ status: "idle" });
      }
      return true;
    } catch {
      // Conversion or sync error — still return true to redirect to activation
      clearStoredSession();
      expatsStore.setState({ status: "idle" });
      return true;
    }
  },

  loadActivationState: async (): Promise<void> => {
    expatsStore.setState({ status: "loading" });
    try {
      const state = await getActivationState();
      expatsStore.setState({ activationState: state, status: "idle" });
    } catch (e) {
      expatsStore.setState({ status: "error", error: "Failed to load activation state" });
      throw e;
    }
  },

  loadOnboarding: async (): Promise<void> => {
    expatsStore.setState({ status: "loading" });
    try {
      const [onboarding, status] = await Promise.all([
        getOnboarding(),
        getOnboardingStatus().catch(() => null),
      ]);
      const merged =
        status && onboarding
          ? {
              ...onboarding,
              completionPercent: status.completionPercent ?? onboarding.completionPercent,
              completedSteps: status.completedSteps ?? onboarding.completedSteps,
            }
          : onboarding;
      expatsStore.setState({ onboarding: merged, status: "idle" });
    } catch (e) {
      expatsStore.setState({ status: "error", error: "Failed to load onboarding" });
      throw e;
    }
  },

  /**
   * When compute scoring returns nothing (e.g. no snapshot yet), load last run from GET /relocation/city-scoring/history.
   */
  tryHydrateScoringFromHistory: async (): Promise<boolean> => {
    try {
      const hist = await getScoringHistory();
      if (!hist.length) return false;
      const bySnap = new Map<string, typeof hist>();
      for (const row of hist) {
        const k = row.snapshotId;
        if (!bySnap.has(k)) bySnap.set(k, []);
        bySnap.get(k)!.push(row);
      }
      let bestSnap = "";
      let bestTime = 0;
      for (const [snap, arr] of bySnap) {
        const maxT = Math.max(...arr.map((s) => new Date(s.computedAt).getTime()));
        if (maxT > bestTime) {
          bestTime = maxT;
          bestSnap = snap;
        }
      }
      const batch = bySnap.get(bestSnap)!;
      batch.sort((a, b) => (a.rankingPosition ?? 999) - (b.rankingPosition ?? 999));
      const { onboarding } = expatsStore.getState();
      const userType = onboarding?.userType ?? "planning_move";
      expatsStore.setState({
        scoringResult: {
          snapshotId: bestSnap,
          analysisType: batch[0]?.analysisType ?? "CITY_RANKING",
          userType,
          scores: batch,
          algorithmVersion: batch[0]?.algorithmVersion ?? "",
        },
      });
      return true;
    } catch (e) {
      console.error("[expatsStore] tryHydrateScoringFromHistory", e);
      return false;
    }
  },

  patchOnboarding: async (fields: Parameters<typeof patchOnboarding>[0]): Promise<void> => {
    expatsStore.setState({ status: "loading" });
    try {
      const onboarding = await patchOnboarding(fields);
      expatsStore.setState({ onboarding, status: "idle" });
    } catch (e) {
      expatsStore.setState({ status: "error", error: "Failed to update onboarding" });
      throw e;
    }
  },

  createSnapshot: async (): Promise<SnapshotResponse> => {
    expatsStore.setState({ status: "loading" });
    try {
      const snapshot = await createSnapshot();
      const { snapshots } = expatsStore.getState();
      expatsStore.setState({ snapshots: [snapshot, ...snapshots], status: "idle" });
      return snapshot;
    } catch (e) {
      expatsStore.setState({ status: "error", error: "Failed to create snapshot" });
      throw e;
    }
  },

  computeScoring: async (targetCityId?: string): Promise<ScoringResultResponse> => {
    expatsStore.setState({ status: "loading" });
    try {
      const result = await computeScoring({
        targetCityId: targetCityId ?? null,
        analysisType: targetCityId ? "CHOSEN_CITY_ANALYSIS" : "CITY_RANKING",
      });
      expatsStore.setState({ scoringResult: result, status: "idle" });
      return result;
    } catch (e) {
      expatsStore.setState({ status: "error", error: "Failed to compute scoring" });
      throw e;
    }
  },

  reset: () => {
    expatsStore.reset();
  },
};
