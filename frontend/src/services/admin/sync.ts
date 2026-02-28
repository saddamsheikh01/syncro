import { apiClient } from "../axiosConfig";
import type {
  GoogleMapsSyncRequest,
  GoogleMapsSyncResponse,
  GoogleMapsSyncStatusResponse,
  GoogleMapsTextSearchSyncRequest,
  ViatorDestinationRefCreateRequest,
  ViatorDestinationRefResponse,
  ViatorDestinationRefUpdateRequest,
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

export const listViatorDestinationRefs = async (): Promise<ViatorDestinationRefResponse[]> => {
  const { data } = await apiClient.get<ViatorDestinationRefResponse[]>(
    "/admin/sync/viator/destinations"
  );
  return data;
};

export const createViatorDestinationRef = async (
  payload: ViatorDestinationRefCreateRequest
): Promise<ViatorDestinationRefResponse> => {
  const { data } = await apiClient.post<ViatorDestinationRefResponse>(
    "/admin/sync/viator/destinations",
    payload
  );
  return data;
};

export const updateViatorDestinationRef = async (
  destinationId: string,
  payload: ViatorDestinationRefUpdateRequest
): Promise<ViatorDestinationRefResponse> => {
  const { data } = await apiClient.patch<ViatorDestinationRefResponse>(
    `/admin/sync/viator/destinations/${encodeURIComponent(destinationId)}`,
    payload
  );
  return data;
};

export const deleteViatorDestinationRef = async (destinationId: string): Promise<void> => {
  await apiClient.delete(`/admin/sync/viator/destinations/${encodeURIComponent(destinationId)}`);
};
