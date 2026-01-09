import type { ApiError } from "../../types/api";
import type {
  UserPositionRequest,
  UserPositionResponse,
} from "../../types/profile";
import { getPosition, upsertPosition } from "../../services/profile";
import { createStore } from "../utils/createStore";

export type PositionPermission = "unknown" | "granted" | "denied";

export type PositionState = {
  permission: PositionPermission;
  position: UserPositionResponse | null;
  loading: boolean;
  error: ApiError | null;
};

const initialState: PositionState = {
  permission: "unknown",
  position: null,
  loading: false,
  error: null,
};

export const positionStore = createStore<PositionState>(initialState);

export const positionActions = {
  setPermission: (permission: PositionPermission) => {
    positionStore.setState({ permission });
  },

  setPosition: (position: UserPositionResponse | null) => {
    positionStore.setState({ position });
  },

  fetchPosition: async (): Promise<UserPositionResponse> => {
    positionStore.setState({ loading: true, error: null });

    try {
      const position = await getPosition();
      positionStore.setState({ position, loading: false });
      return position;
    } catch (error) {
      positionStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  savePosition: async (
    payload: UserPositionRequest
  ): Promise<UserPositionResponse> => {
    positionStore.setState({ loading: true, error: null });

    try {
      const position = await upsertPosition(payload);
      positionStore.setState({ position, loading: false });
      return position;
    } catch (error) {
      positionStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },
};
