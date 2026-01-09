"use client";

import { useStore } from "../utils/useStore";
import type { UserState } from "./userStore";
import { userStore } from "./userStore";

export const useUserStore = <Selected = UserState>(
  selector?: (state: UserState) => Selected
) => useStore(userStore, selector);
