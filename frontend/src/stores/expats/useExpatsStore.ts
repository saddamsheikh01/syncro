"use client";

import { useStore } from "../utils/useStore";
import { expatsStore } from "./expatsStore";
import type { ExpatsState } from "./expatsStore";

export const useExpatsStore = <T = ExpatsState>(
  selector?: (state: ExpatsState) => T
): T => useStore(expatsStore, selector);
