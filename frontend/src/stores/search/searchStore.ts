import type { ApiError } from "../../types/api";
import type {
  ExperienceSummaryResponse,
  PlaceSummaryResponse,
} from "../../types/catalog";
import type { PostResponse } from "../../types/social";
import type { UserSearchResult } from "../../types/search";
import { globalSearch } from "../../services/search";
import { createStore } from "../utils/createStore";

export type SearchState = {
  query: string;
  places: PlaceSummaryResponse[];
  experiences: ExperienceSummaryResponse[];
  users: UserSearchResult[];
  posts: PostResponse[];
  loading: boolean;
  error: ApiError | null;
  isOpen: boolean;
};

const initialState: SearchState = {
  query: "",
  places: [],
  experiences: [],
  users: [],
  posts: [],
  loading: false,
  error: null,
  isOpen: false,
};

export const searchStore = createStore<SearchState>(initialState);

export const searchActions = {
  setQuery: (query: string) => {
    searchStore.setState({ query });
  },

  setOpen: (isOpen: boolean) => {
    searchStore.setState({ isOpen });
  },

  search: async (query: string): Promise<void> => {
    searchStore.setState({ query, loading: true, error: null });

    if (!query || query.trim().length < 2) {
      searchStore.setState({
        places: [],
        experiences: [],
        users: [],
        posts: [],
        loading: false,
      });
      return;
    }

    try {
      const response = await globalSearch({ q: query, limit: 5 });
      searchStore.setState({
        places: response.places,
        experiences: response.experiences,
        users: response.users,
        posts: response.posts,
        loading: false,
      });
    } catch (error) {
      searchStore.setState({ loading: false, error: error as ApiError });
    }
  },

  clear: () => {
    searchStore.setState(initialState);
  },
};
