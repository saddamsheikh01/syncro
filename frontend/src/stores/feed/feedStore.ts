import type { ApiError } from "../../types/api";
import type { PostResponse } from "../../types/social";
import type { Uuid } from "../../types/shared";
import { createStore } from "../utils/createStore";
import {
  getFeed,
  likePost,
  unlikePost,
  type FeedParams,
} from "../../services/social";

export type FeedState = {
  items: PostResponse[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  filters: FeedParams;
  loading: boolean;
  error: ApiError | null;
};

const initialState: FeedState = {
  items: [],
  page: 0,
  size: 0,
  totalPages: 0,
  totalElements: 0,
  filters: {},
  loading: false,
  error: null,
};

export const feedStore = createStore<FeedState>(initialState);

const applyFeedResponse = (
  response: {
    content: PostResponse[];
    number: number;
    size: number;
    totalPages: number;
    totalElements: number;
  },
  append: boolean
) => {
  feedStore.setState((state) => ({
    items: append ? [...state.items, ...response.content] : response.content,
    page: response.number,
    size: response.size,
    totalPages: response.totalPages,
    totalElements: response.totalElements,
    loading: false,
    error: null,
  }));
};

const updatePost = (
  postId: Uuid,
  updater: (post: PostResponse) => PostResponse
) => {
  feedStore.setState((state) => ({
    items: state.items.map((post) =>
      post.id === postId ? updater(post) : post
    ),
  }));
};

export const feedActions = {
  setFilters: (filters: FeedParams) => {
    feedStore.setState({ filters });
  },

  resetFeed: () => {
    feedStore.setState({
      items: [],
      page: 0,
      size: 0,
      totalPages: 0,
      totalElements: 0,
      error: null,
    });
  },

  fetchFeed: async (
    params: FeedParams = {},
    options: { append?: boolean } = {}
  ) => {
    feedStore.setState({ loading: true, error: null, filters: params });

    try {
      const response = await getFeed(params);
      applyFeedResponse(response, options.append ?? false);
      return response;
    } catch (error) {
      feedStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  likePost: async (postId: Uuid) => {
    updatePost(postId, (post) => ({
      ...post,
      likedByMe: true,
      likeCount: post.likeCount + 1,
    }));

    try {
      await likePost(postId);
    } catch (error) {
      updatePost(postId, (post) => ({
        ...post,
        likedByMe: false,
        likeCount: Math.max(0, post.likeCount - 1),
      }));
      feedStore.setState({ error: error as ApiError });
      throw error;
    }
  },

  unlikePost: async (postId: Uuid) => {
    updatePost(postId, (post) => ({
      ...post,
      likedByMe: false,
      likeCount: Math.max(0, post.likeCount - 1),
    }));

    try {
      await unlikePost(postId);
    } catch (error) {
      updatePost(postId, (post) => ({
        ...post,
        likedByMe: true,
        likeCount: post.likeCount + 1,
      }));
      feedStore.setState({ error: error as ApiError });
      throw error;
    }
  },
};
