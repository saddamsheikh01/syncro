"use client";

import { useStore } from "../utils/useStore";
import type { AdminAuthState } from "./adminAuthStore";
import { adminAuthStore } from "./adminAuthStore";

export const useAdminAuthStore = <Selected = AdminAuthState>(
  selector?: (state: AdminAuthState) => Selected
) => useStore(adminAuthStore, selector);
