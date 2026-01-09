"use client";

import { useSyncExternalStore } from "react";
import type { StoreApi } from "./createStore";

export const useStore = <
  State extends Record<string, unknown>,
  Selected = State
>(
  store: StoreApi<State>,
  selector?: (state: State) => Selected
): Selected => {
  const getSnapshot = () =>
    selector
      ? selector(store.getState())
      : (store.getState() as unknown as Selected);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
};
