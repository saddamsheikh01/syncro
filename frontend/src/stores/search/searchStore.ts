import type { ApiError } from "../../types/api";
import type {
  ExperienceSummaryResponse,
  PlaceSummaryResponse,
} from "../../types/catalog";
import type { PostResponse } from "../../types/social";
import type { UserSearchResult } from "../../types/search";
import { globalSearch } from "../../services/search";
import { createStore } from "../utils/createStore";

const SEARCH_HISTORY_KEY = "syncro-search-history";
const SEARCH_HISTORY_MAX = 10;

function loadSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, SEARCH_HISTORY_MAX)
      : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export type SearchState = {
  query: string;
  places: PlaceSummaryResponse[];
  experiences: ExperienceSummaryResponse[];
  users: UserSearchResult[];
  posts: PostResponse[];
  loading: boolean;
  error: ApiError | null;
  isOpen: boolean;
  searchHistory: string[];
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
  searchHistory: [],
};

export const searchStore = createStore<SearchState>(initialState);

export const searchActions = {
  setQuery: (query: string) => {
    searchStore.setState({ query });
  },

  setOpen: (isOpen: boolean) => {
    const state = searchStore.getState();
    const searchHistory = state.searchHistory.length > 0 ? state.searchHistory : loadSearchHistory();
    searchStore.setState({ isOpen, searchHistory });
  },

  addToHistory: (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const state = searchStore.getState();
    const history = state.searchHistory.length > 0 ? state.searchHistory : loadSearchHistory();
    const next = [trimmed, ...history.filter((q) => q !== trimmed)].slice(0, SEARCH_HISTORY_MAX);
    searchStore.setState({ searchHistory: next });
    saveSearchHistory(next);
  },

  clearHistory: () => {
    searchStore.setState({ searchHistory: [] });
    saveSearchHistory([]);
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
      searchActions.addToHistory(query.trim());
    } catch (error) {
      searchStore.setState({ loading: false, error: error as ApiError });
    }
  },

  clear: () => {
    searchStore.setState(initialState);
  },
};
