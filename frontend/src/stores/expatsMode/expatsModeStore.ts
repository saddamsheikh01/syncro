"use client";

import { createStore } from "../utils/createStore";

const EXPATS_MODE_ACTIVE_KEY = "syncro_expats_mode_active";

export interface ExpatsModeState extends Record<string, unknown> {
  isExpatsModeActive: boolean;
}

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(EXPATS_MODE_ACTIVE_KEY) === "true";
  } catch {
    return false;
  }
}

const initialState: ExpatsModeState = {
  isExpatsModeActive: false,
};

export const expatsModeStore = createStore<ExpatsModeState>(initialState);

export const expatsModeActions = {
  setActive(active: boolean) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(EXPATS_MODE_ACTIVE_KEY, active ? "true" : "false");
      } catch {
        /* ignore */
      }
    }
    expatsModeStore.setState({ isExpatsModeActive: active });
  },

  rehydrate() {
    const active = readStored();
    expatsModeStore.setState({ isExpatsModeActive: active });
  },
};
