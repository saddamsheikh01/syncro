import type { ApiError } from "../../types/api";
import type {
  TagResponse,
  UpdateUserInterestsRequest,
  UserInterestsResponse,
} from "../../types/tags";
import {
  getTags,
  getUserInterests,
  updateUserInterests,
} from "../../services/tags";
import { createStore } from "../utils/createStore";

export type TagsState = {
  tags: TagResponse[];
  interests: UserInterestsResponse | null;
  loading: boolean;
  error: ApiError | null;
};

const initialState: TagsState = {
  tags: [],
  interests: null,
  loading: false,
  error: null,
};

export const tagsStore = createStore<TagsState>(initialState);

export const tagsActions = {
  fetchTags: async (): Promise<TagResponse[]> => {
    tagsStore.setState({ loading: true, error: null });

    try {
      const response = await getTags();
      tagsStore.setState({ tags: response.tags, loading: false });
      return response.tags;
    } catch (error) {
      tagsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  fetchUserInterests: async (): Promise<UserInterestsResponse> => {
    tagsStore.setState({ loading: true, error: null });

    try {
      const response = await getUserInterests();
      tagsStore.setState({ interests: response, loading: false });
      return response;
    } catch (error) {
      tagsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  updateUserInterests: async (
    payload: UpdateUserInterestsRequest
  ): Promise<UserInterestsResponse> => {
    tagsStore.setState({ loading: true, error: null });

    try {
      const response = await updateUserInterests(payload);
      tagsStore.setState({ interests: response, loading: false });
      return response;
    } catch (error) {
      tagsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },
};
