export type StoreListener = () => void;

export type StoreUpdater<State extends Record<string, unknown>> =
  | Partial<State>
  | State
  | ((state: State) => Partial<State> | State);

export type StoreApi<State extends Record<string, unknown>> = {
  getState: () => State;
  setState: (updater: StoreUpdater<State>, replace?: boolean) => void;
  subscribe: (listener: StoreListener) => () => void;
  reset: () => void;
};

export const createStore = <State extends Record<string, unknown>>(
  initialState: State
): StoreApi<State> => {
  let state = initialState;
  const listeners = new Set<StoreListener>();

  const getState = () => state;

  const setState = (updater: StoreUpdater<State>, replace = false) => {
    const nextState =
      typeof updater === "function" ? updater(state) : updater;

    state = replace
      ? (nextState as State)
      : {
          ...state,
          ...(nextState as Partial<State>),
        };

    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: StoreListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const reset = () => {
    state = initialState;
    listeners.forEach((listener) => listener());
  };

  return {
    getState,
    setState,
    subscribe,
    reset,
  };
};
