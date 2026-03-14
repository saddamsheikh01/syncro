import type { ApiError } from "../../types/api";
import type {
  CatalogResponse,
  CategoryResponse,
  ExperienceDetailResponse,
  ExperienceSummaryResponse,
  PlaceDetailResponse,
  PlaceSummaryResponse,
} from "../../types/catalog";
import type { PageResponse, Uuid } from "../../types/shared";
import type { CatalogSearchParams, CategoryListParams } from "../../services/catalog";
import {
  getCatalog,
  getCategories,
  getExperience,
  getExperiencesWithPolling,
  getPlace,
  getPlaces,
} from "../../services/catalog";
import { createStore } from "../utils/createStore";

export type PageInfo = {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
};

const emptyPage: PageInfo = {
  page: 0,
  size: 0,
  totalPages: 0,
  totalElements: 0,
};

export type CatalogState = {
  categories: CategoryResponse[];
  categoriesPage: PageInfo;
  places: PlaceSummaryResponse[];
  placesPage: PageInfo;
  experiences: ExperienceSummaryResponse[];
  experiencesPage: PageInfo;
  /** Unified "All" tab: places from GET /catalog */
  catalogPlaces: PlaceSummaryResponse[];
  /** Unified "All" tab: experiences from GET /catalog */
  catalogExperiences: ExperienceSummaryResponse[];
  catalogPlacesPage: PageInfo;
  catalogExperiencesPage: PageInfo;
  placeDetail: PlaceDetailResponse | null;
  experienceDetail: ExperienceDetailResponse | null;
  filters: CatalogSearchParams;
  loading: boolean;
  /** True while unified catalog (All) is loading */
  loadingCatalog: boolean;
  /** True when catalog request is "load more" (append) — don't show full overlay */
  loadingCatalogAppend: boolean;
  /** True when places/experiences request is "load more" (append) — don't show full overlay */
  loadingAppend: boolean;
  /** Incremented on each fetchCatalog start; only clear loading when the completing request matches latest */
  catalogRequestId: number;
  error: ApiError | null;
};

const initialState: CatalogState = {
  categories: [],
  categoriesPage: emptyPage,
  places: [],
  placesPage: emptyPage,
  experiences: [],
  experiencesPage: emptyPage,
  catalogPlaces: [],
  catalogExperiences: [],
  catalogPlacesPage: emptyPage,
  catalogExperiencesPage: emptyPage,
  placeDetail: null,
  experienceDetail: null,
  filters: {},
  loading: false,
  loadingCatalog: false,
  loadingCatalogAppend: false,
  loadingAppend: false,
  catalogRequestId: 0,
  error: null,
};

export const catalogStore = createStore<CatalogState>(initialState);

const ERROR_AUTO_DISMISS_MS = 5000;
let errorDismissTimeoutId: ReturnType<typeof setTimeout> | null = null;

const scheduleErrorDismiss = () => {
  if (errorDismissTimeoutId) clearTimeout(errorDismissTimeoutId);
  errorDismissTimeoutId = setTimeout(() => {
    errorDismissTimeoutId = null;
    catalogStore.setState({ error: null });
  }, ERROR_AUTO_DISMISS_MS);
};

const mapPageInfo = (response: PageResponse<unknown>): PageInfo => ({
  page: response.number,
  size: response.size,
  totalPages: response.totalPages,
  totalElements: response.totalElements,
});

export const catalogActions = {
  setFilters: (filters: CatalogSearchParams) => {
    catalogStore.setState({ filters });
  },

  /** Set loading explicitly (e.g. so Experiences tab shows loader immediately on "Near me" click). */
  setLoading: (loading: boolean) => {
    catalogStore.setState({ loading });
  },

  fetchCategories: async (
    params: CategoryListParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<CategoryResponse>> => {
    catalogStore.setState({ loading: true, error: null });

    try {
      const response = await getCategories(params);
      catalogStore.setState((state) => ({
        categories: options.append
          ? [...state.categories, ...response.content]
          : response.content,
        categoriesPage: mapPageInfo(response),
        loading: false,
      }));
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, error: error as ApiError });
      scheduleErrorDismiss();
      throw error;
    }
  },

  fetchCatalog: async (
    params: CatalogSearchParams = {},
    options: { append?: boolean } = {}
  ): Promise<CatalogResponse> => {
    const append = options.append ?? false;
    const requestId = catalogStore.getState().catalogRequestId + 1;
    catalogStore.setState({
      loadingCatalog: true,
      loadingCatalogAppend: append,
      catalogRequestId: requestId,
      error: null,
      filters: params,
    });

    try {
      const response = await getCatalog(params);
      const placesPageInfo: PageInfo = {
        page: response.placesPage,
        size: response.placesSize,
        totalPages: response.placesTotalPages,
        totalElements: response.placesTotalElements,
      };
      const experiencesPageInfo: PageInfo = {
        page: response.experiencesPage,
        size: response.experiencesSize,
        totalPages: response.experiencesTotalPages,
        totalElements: response.experiencesTotalElements,
      };
      catalogStore.setState((state) => {
        if (state.catalogRequestId !== requestId) return {};
        return {
          catalogPlaces: options.append
            ? [...state.catalogPlaces, ...response.places]
            : response.places,
          catalogExperiences: options.append
            ? [...state.catalogExperiences, ...response.experiences]
            : response.experiences,
          catalogPlacesPage: placesPageInfo,
          catalogExperiencesPage: experiencesPageInfo,
          loadingCatalog: false,
          loadingCatalogAppend: false,
        };
      });
      return response;
    } catch (error) {
      const isLatest =
        catalogStore.getState().catalogRequestId === requestId;
      catalogStore.setState((state) => {
        if (state.catalogRequestId !== requestId) return {};
        return {
          loadingCatalog: false,
          loadingCatalogAppend: false,
          error: error as ApiError,
        };
      });
      if (isLatest) scheduleErrorDismiss();
      throw error;
    }
  },

  fetchPlaces: async (
    params: CatalogSearchParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<PlaceSummaryResponse>> => {
    const append = options.append ?? false;
    catalogStore.setState({
      loading: true,
      loadingAppend: append,
      error: null,
      filters: params,
    });

    try {
      const response = await getPlaces(params);
      catalogStore.setState((state) => ({
        places: options.append
          ? [...state.places, ...response.content]
          : response.content,
        placesPage: mapPageInfo(response),
        loading: false,
        loadingAppend: false,
      }));
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, loadingAppend: false, error: error as ApiError });
      scheduleErrorDismiss();
      throw error;
    }
  },

  fetchPlace: async (placeId: Uuid): Promise<PlaceDetailResponse> => {
    catalogStore.setState({ loading: true, error: null });

    try {
      const response = await getPlace(placeId);
      catalogStore.setState({ placeDetail: response, loading: false });
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, error: error as ApiError });
      scheduleErrorDismiss();
      throw error;
    }
  },

  fetchExperiences: async (
    params: CatalogSearchParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<ExperienceSummaryResponse>> => {
    const append = options.append ?? false;
    catalogStore.setState({
      loading: true,
      loadingAppend: append,
      error: null,
      filters: params,
    });

    try {
      const response = await getExperiencesWithPolling(params);
      catalogStore.setState((state) => ({
        experiences: options.append
          ? [...state.experiences, ...response.content]
          : response.content,
        experiencesPage: mapPageInfo(response),
        loading: false,
        loadingAppend: false,
      }));
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, loadingAppend: false, error: error as ApiError });
      scheduleErrorDismiss();
      throw error;
    }
  },

  fetchExperience: async (
    experienceId: string
  ): Promise<ExperienceDetailResponse> => {
    catalogStore.setState({ loading: true, error: null });

    try {
      const response = await getExperience(experienceId);
      catalogStore.setState({ experienceDetail: response, loading: false });
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, error: error as ApiError });
      scheduleErrorDismiss();
      throw error;
    }
  },

  clearDetails: () => {
    catalogStore.setState({ placeDetail: null, experienceDetail: null });
  },
};
