import type { JsonObject } from "../../types/shared";
import { createStore } from "../utils/createStore";

export type ToastTone = "info" | "success" | "warning" | "error";

export type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

export type ModalState = {
  id: string | null;
  payload: JsonObject | null;
};

export type UiState = {
  toasts: Toast[];
  modal: ModalState;
};

const initialState: UiState = {
  toasts: [],
  modal: { id: null, payload: null },
};

export const uiStore = createStore<UiState>(initialState);

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const uiActions = {
  pushToast: (message: string, tone: ToastTone = "info") => {
    const toast: Toast = { id: generateId(), message, tone };
    uiStore.setState((state) => ({ toasts: [...state.toasts, toast] }));
    return toast;
  },

  dismissToast: (toastId: string) => {
    uiStore.setState((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    }));
  },

  clearToasts: () => {
    uiStore.setState({ toasts: [] });
  },

  openModal: (id: string, payload: JsonObject | null = null) => {
    uiStore.setState({ modal: { id, payload } });
  },

  closeModal: () => {
    uiStore.setState({ modal: { id: null, payload: null } });
  },
};
