"use client";

import { useStore } from "../utils/useStore";
import type { PositionState } from "./positionStore";
import { positionStore } from "./positionStore";

export const usePositionStore = <Selected = PositionState>(
  selector?: (state: PositionState) => Selected
) => useStore(positionStore, selector);
