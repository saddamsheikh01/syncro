import type { ApiError } from "../../types/api";
import type {
  UserPositionRequest,
  UserPositionResponse,
} from "../../types/profile";
import { getPosition, upsertPosition } from "../../services/profile";
import { createStore } from "../utils/createStore";
import { readStorage, writeStorage } from "../utils/storage";

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

const POSITION_STORAGE_KEY = "syncro.user.position";

export const positionActions = {
  hydrate: () => {
    const position = readStorage<UserPositionResponse | null>(
      POSITION_STORAGE_KEY,
      null
    );
    positionStore.setState({ position });
  },

  setPermission: (permission: PositionPermission) => {
    positionStore.setState({ permission });
  },

  setPosition: (position: UserPositionResponse | null) => {
    positionStore.setState({ position });
    writeStorage(POSITION_STORAGE_KEY, position);
  },

  fetchPosition: async (): Promise<UserPositionResponse> => {
    positionStore.setState({ loading: true, error: null });

    try {
      const position = await getPosition();
      positionStore.setState({ position, loading: false });
      writeStorage(POSITION_STORAGE_KEY, position);
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
      writeStorage(POSITION_STORAGE_KEY, position);
      return position;
    } catch (error) {
      positionStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },
};
