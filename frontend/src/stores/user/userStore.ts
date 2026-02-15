import type { ApiError } from "../../types/api";
import type { UpdateUserRequest, UserResponse } from "../../types/auth";
import type {
  UserPreferencesRequest,
  UserPreferencesResponse,
  UserProfileRequest,
  UserProfileResponse,
} from "../../types/profile";
import { getCurrentUser, updateCurrentUser } from "../../services/users";
import {
  getPreferences,
  getProfile,
  upsertPreferences,
  upsertProfile,
} from "../../services/profile";
import { authActions } from "../auth/authStore";
import { createStore } from "../utils/createStore";
import { readStorage, writeStorage } from "../utils/storage";
import { normalizeLocale } from "@/i18n/locales";
import type { SupportedLocale } from "@/i18n/locales";
import { setLocaleCookie } from "@/i18n/cookies";

export type UserState = {
  profile: UserProfileResponse | null;
  preferences: UserPreferencesResponse | null;
  language: string | null;
  loading: boolean;
  error: ApiError | null;
};

const LANGUAGE_STORAGE_KEY = "syncro.user.language";

const initialState: UserState = {
  profile: null,
  preferences: null,
  language: null,
  loading: false,
  error: null,
};

export const userStore = createStore<UserState>(initialState);

const applyUserResponse = (user: UserResponse) => {
  const normalized = normalizeLocale(user.language);
  userStore.setState({ language: normalized });
  writeStorage(LANGUAGE_STORAGE_KEY, normalized);
  if (normalized) {
    setLocaleCookie(normalized as SupportedLocale);
  }
  authActions.setUser(user);
};

export const userActions = {
  hydrateLanguage: () => {
    const raw = readStorage<string | null>(LANGUAGE_STORAGE_KEY, null);
    const language = normalizeLocale(raw);
    userStore.setState({ language });
    if (language) {
      setLocaleCookie(language as SupportedLocale);
    }
  },

  setLanguage: (language: string | null) => {
    const normalized = normalizeLocale(language);
    userStore.setState({ language: normalized });
    writeStorage(LANGUAGE_STORAGE_KEY, normalized);
    if (normalized) {
      setLocaleCookie(normalized as SupportedLocale);
    }
  },

  fetchCurrentUser: async (): Promise<UserResponse> => {
    userStore.setState({ loading: true, error: null });

    try {
      const user = await getCurrentUser();
      applyUserResponse(user);
      userStore.setState({ loading: false });
      return user;
    } catch (error) {
      userStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  updateUser: async (payload: UpdateUserRequest): Promise<UserResponse> => {
    userStore.setState({ loading: true, error: null });

    try {
      const user = await updateCurrentUser(payload);
      applyUserResponse(user);
      userStore.setState({ loading: false });
      return user;
    } catch (error) {
      userStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  fetchProfile: async (): Promise<UserProfileResponse> => {
    userStore.setState({ loading: true, error: null });

    try {
      const profile = await getProfile();
      userStore.setState({ profile, loading: false });
      return profile;
    } catch (error) {
      userStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  saveProfile: async (
    payload: UserProfileRequest
  ): Promise<UserProfileResponse> => {
    userStore.setState({ loading: true, error: null });

    try {
      const profile = await upsertProfile(payload);
      userStore.setState({ profile, loading: false });
      return profile;
    } catch (error) {
      userStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  fetchPreferences: async (): Promise<UserPreferencesResponse> => {
    userStore.setState({ loading: true, error: null });

    try {
      const preferences = await getPreferences();
      userStore.setState({ preferences, loading: false });
      return preferences;
    } catch (error) {
      userStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  savePreferences: async (
    payload: UserPreferencesRequest
  ): Promise<UserPreferencesResponse> => {
    userStore.setState({ loading: true, error: null });

    try {
      const preferences = await upsertPreferences(payload);
      userStore.setState({ preferences, loading: false });
      return preferences;
    } catch (error) {
      userStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },
};
