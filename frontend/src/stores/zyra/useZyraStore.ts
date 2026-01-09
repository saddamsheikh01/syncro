"use client";

import { useStore } from "../utils/useStore";
import type { ZyraState } from "./zyraStore";
import { zyraStore } from "./zyraStore";

export const useZyraStore = <Selected = ZyraState>(
  selector?: (state: ZyraState) => Selected
) => useStore(zyraStore, selector);
