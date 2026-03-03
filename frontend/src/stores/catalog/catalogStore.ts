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
  getExperiences,
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
  error: null,
};

export const catalogStore = createStore<CatalogState>(initialState);

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
      throw error;
    }
  },

  fetchCatalog: async (
    params: CatalogSearchParams = {},
    options: { append?: boolean } = {}
  ): Promise<CatalogResponse> => {
    catalogStore.setState({ loadingCatalog: true, error: null, filters: params });

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
      catalogStore.setState((state) => ({
        catalogPlaces: options.append
          ? [...state.catalogPlaces, ...response.places]
          : response.places,
        catalogExperiences: options.append
          ? [...state.catalogExperiences, ...response.experiences]
          : response.experiences,
        catalogPlacesPage: placesPageInfo,
        catalogExperiencesPage: experiencesPageInfo,
        loadingCatalog: false,
      }));
      return response;
    } catch (error) {
      catalogStore.setState({ loadingCatalog: false, error: error as ApiError });
      throw error;
    }
  },

  fetchPlaces: async (
    params: CatalogSearchParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<PlaceSummaryResponse>> => {
    catalogStore.setState({ loading: true, error: null, filters: params });

    try {
      const response = await getPlaces(params);
      catalogStore.setState((state) => ({
        places: options.append
          ? [...state.places, ...response.content]
          : response.content,
        placesPage: mapPageInfo(response),
        loading: false,
      }));
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, error: error as ApiError });
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
      throw error;
    }
  },

  fetchExperiences: async (
    params: CatalogSearchParams = {},
    options: { append?: boolean } = {}
  ): Promise<PageResponse<ExperienceSummaryResponse>> => {
    catalogStore.setState({ loading: true, error: null, filters: params });

    try {
      const response = await getExperiences(params);
      catalogStore.setState((state) => ({
        experiences: options.append
          ? [...state.experiences, ...response.content]
          : response.content,
        experiencesPage: mapPageInfo(response),
        loading: false,
      }));
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  fetchExperience: async (
    experienceId: Uuid
  ): Promise<ExperienceDetailResponse> => {
    catalogStore.setState({ loading: true, error: null });

    try {
      const response = await getExperience(experienceId);
      catalogStore.setState({ experienceDetail: response, loading: false });
      return response;
    } catch (error) {
      catalogStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  clearDetails: () => {
    catalogStore.setState({ placeDetail: null, experienceDetail: null });
  },
};
