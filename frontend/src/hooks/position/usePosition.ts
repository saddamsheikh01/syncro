"use client";

import { useMemo } from "react";
import { positionActions } from "../../stores/position/positionStore";
import { usePositionStore } from "../../stores/position/usePositionStore";

export const usePosition = () => {
  const state = usePositionStore();

  const actions = useMemo(
    () => ({
      hydrate: positionActions.hydrate,
      setPermission: positionActions.setPermission,
      setPosition: positionActions.setPosition,
      fetchPosition: positionActions.fetchPosition,
      savePosition: positionActions.savePosition,
    }),
    []
  );

  const hasPosition =
    state.position !== null &&
    state.position.latitude !== null &&
    state.position.longitude !== null;

  return {
    ...state,
    hasPosition,
    actions,
  };
};
