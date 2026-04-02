"use client";

import { useState, useCallback } from "react";
import axios from "axios";

export type RegistrationGateContext =
  | "simulation_history"
  | "budget_tracking"
  | "starter_kit"
  | "micro_test"
  | "risk_indicators"
  | "premium_plan"
  | "super_pro_plan"
  | "generic";

const CONTEXT_MESSAGES: Record<RegistrationGateContext, string> = {
  simulation_history: "Create a free account to save and view your simulation history.",
  budget_tracking: "Track your real expenses vs budget with a free account.",
  starter_kit: "Get your personalized relocation starter kit by creating an account.",
  micro_test: "Unlock personalized assessments with a free account.",
  risk_indicators: "See your full risk analysis by creating an account.",
  premium_plan: "Upgrade to Premium for advanced budget analysis and stability scoring.",
  super_pro_plan: "Upgrade to Super Pro for full projections, optimization plans and more.",
  generic: "Create a free account to unlock all features.",
};

function isRegistrationRequired(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const data = error.response?.data;
  return error.response?.status === 403 && data?.code === "REGISTRATION_REQUIRED";
}

export const useRegistrationGate = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<RegistrationGateContext>("generic");

  const openGate = useCallback((context: RegistrationGateContext = "generic") => {
    setModalContext(context);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const gatedAction = useCallback(
    async <T>(action: () => Promise<T>, context: RegistrationGateContext = "generic"): Promise<T | null> => {
      try {
        return await action();
      } catch (error) {
        if (isRegistrationRequired(error)) {
          openGate(context);
          return null;
        }
        throw error;
      }
    },
    [openGate]
  );

  return {
    isModalOpen,
    modalContext,
    modalMessage: CONTEXT_MESSAGES[modalContext],
    openGate,
    closeModal,
    gatedAction,
  };
};
