"use client";

import { useCallback } from "react";
import { useExpatsStore } from "../../stores/expats/useExpatsStore";
import { expatsActions } from "../../stores/expats/expatsStore";
import type { FunnelAnswers } from "../../types/expats";

export const useExpats = () => {
  const status = useExpatsStore((s) => s.status);
  const error = useExpatsStore((s) => s.error);
  const session = useExpatsStore((s) => s.session);
  const currentStep = useExpatsStore((s) => s.currentStep);
  const funnelAnswers = useExpatsStore((s) => s.funnelAnswers);
  const onboarding = useExpatsStore((s) => s.onboarding);
  const activationState = useExpatsStore((s) => s.activationState);
  const snapshots = useExpatsStore((s) => s.snapshots);
  const scoringResult = useExpatsStore((s) => s.scoringResult);

  const isLoading = status === "loading";

  const initSession = useCallback(() => expatsActions.initSession(), []);

  const saveAnswer = useCallback(
    (
      stepNumber: number,
      questionGroup: "CITY_FIT" | "POSITIONING" | "EXECUTION",
      questionKey: string,
      answerValue: unknown,
      localUpdate?: Partial<FunnelAnswers>
    ) =>
      expatsActions.saveStepAnswer(
        stepNumber,
        questionGroup,
        questionKey,
        answerValue,
        localUpdate
      ),
    []
  );

  const setLocalAnswer = useCallback(
    (updates: Partial<FunnelAnswers>) => expatsActions.setLocalAnswer(updates),
    []
  );

  const goToStep = useCallback((step: number) => expatsActions.goToStep(step), []);

  const convertSession = useCallback(() => expatsActions.convertSession(), []);
  const convertAndSync = useCallback(() => expatsActions.convertAndSync(), []);

  const loadActivationState = useCallback(
    () => expatsActions.loadActivationState(),
    []
  );

  const loadOnboarding = useCallback(() => expatsActions.loadOnboarding(), []);

  const patchOnboarding = useCallback(
    (fields: Parameters<typeof expatsActions.patchOnboarding>[0]) =>
      expatsActions.patchOnboarding(fields),
    []
  );

  const createSnapshot = useCallback(() => expatsActions.createSnapshot(), []);

  const computeScoring = useCallback(
    (targetCityId?: string) => expatsActions.computeScoring(targetCityId),
    []
  );

  const getStoredSessionToken = useCallback(
    () => expatsActions.getStoredSessionToken(),
    []
  );

  return {
    status,
    error,
    isLoading,
    session,
    currentStep,
    funnelAnswers,
    onboarding,
    activationState,
    snapshots,
    scoringResult,
    initSession,
    saveAnswer,
    setLocalAnswer,
    goToStep,
    convertSession,
    convertAndSync,
    loadActivationState,
    loadOnboarding,
    patchOnboarding,
    createSnapshot,
    computeScoring,
    getStoredSessionToken,
  };
};
