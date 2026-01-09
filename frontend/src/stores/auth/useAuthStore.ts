"use client";

import { useStore } from "../utils/useStore";
import type { AuthState } from "./authStore";
import { authStore } from "./authStore";

export const useAuthStore = <Selected = AuthState>(
  selector?: (state: AuthState) => Selected
) => useStore(authStore, selector);
