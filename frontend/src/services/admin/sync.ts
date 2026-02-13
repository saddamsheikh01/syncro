import { apiClient } from "../axiosConfig";
import type {
  GoogleMapsSyncRequest,
  GoogleMapsSyncResponse,
  GoogleMapsSyncStatusResponse,
  GoogleMapsTextSearchSyncRequest,
  ViatorSyncRequest,
  ViatorSyncResponse,
  ViatorSyncStatusResponse,
} from "../../types/admin";

export const getGoogleMapsSyncStatus = async (): Promise<GoogleMapsSyncStatusResponse> => {
  const { data } = await apiClient.post<GoogleMapsSyncStatusResponse>(
    "/admin/sync/google-maps/status"
  );
  return data;
};

export const syncGoogleMapsNearby = async (
  payload: GoogleMapsSyncRequest
): Promise<GoogleMapsSyncResponse> => {
  const { data } = await apiClient.post<GoogleMapsSyncResponse>(
    "/admin/sync/google-maps/nearby",
    payload
  );
  return data;
};

export const syncGoogleMapsSearch = async (
  payload: GoogleMapsTextSearchSyncRequest
): Promise<GoogleMapsSyncResponse> => {
  const { data } = await apiClient.post<GoogleMapsSyncResponse>(
    "/admin/sync/google-maps/search",
    payload
  );
  return data;
};

export const syncGoogleMapsPlace = async (
  googlePlaceId: string
): Promise<GoogleMapsSyncResponse> => {
  const { data } = await apiClient.post<GoogleMapsSyncResponse>(
    `/admin/sync/google-maps/place/${encodeURIComponent(googlePlaceId)}`
  );
  return data;
};

export const getViatorSyncStatus = async (): Promise<ViatorSyncStatusResponse> => {
  const { data } = await apiClient.post<ViatorSyncStatusResponse>(
    "/admin/sync/viator/status"
  );
  return data;
};

export const syncViatorProducts = async (
  payload: ViatorSyncRequest = {}
): Promise<ViatorSyncResponse> => {
  const { data } = await apiClient.post<ViatorSyncResponse>(
    "/admin/sync/viator/products",
    payload
  );
  return data;
};
