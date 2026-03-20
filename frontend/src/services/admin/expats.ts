import { apiClient } from "../axiosConfig";
import type {
  AdminCityDatasetResponse,
  AdminCreateCityPayload,
  AdminCreateWeightRulePayload,
  AdminScoringConfigResponse,
  AdminUpdateCityPayload,
  AdminUpdateScoringConfigPayload,
  AdminUpdateWeightRulePayload,
  AdminWaitingListEntry,
  AdminWeightRuleResponse,
} from "@/types/adminExpats";

const BASE = "/admin/expats";

export const adminGetExpatsCities = async (): Promise<AdminCityDatasetResponse[]> => {
  const { data } = await apiClient.get<AdminCityDatasetResponse[]>(`${BASE}/cities`);
  return data;
};

export const adminGetExpatsCity = async (cityId: string): Promise<AdminCityDatasetResponse> => {
  const { data } = await apiClient.get<AdminCityDatasetResponse>(`${BASE}/cities/${cityId}`);
  return data;
};

export const adminCreateExpatsCity = async (
  payload: AdminCreateCityPayload
): Promise<AdminCityDatasetResponse> => {
  const { data } = await apiClient.post<AdminCityDatasetResponse>(`${BASE}/cities`, payload);
  return data;
};

export const adminUpdateExpatsCity = async (
  cityId: string,
  payload: AdminUpdateCityPayload
): Promise<AdminCityDatasetResponse> => {
  const { data } = await apiClient.put<AdminCityDatasetResponse>(`${BASE}/cities/${cityId}`, payload);
  return data;
};

export const adminGetWeightRules = async (): Promise<AdminWeightRuleResponse[]> => {
  const { data } = await apiClient.get<AdminWeightRuleResponse[]>(`${BASE}/weight-rules`);
  return data;
};

export const adminGetWeightRule = async (ruleId: string): Promise<AdminWeightRuleResponse> => {
  const { data } = await apiClient.get<AdminWeightRuleResponse>(`${BASE}/weight-rules/${ruleId}`);
  return data;
};

export const adminCreateWeightRule = async (
  payload: AdminCreateWeightRulePayload
): Promise<AdminWeightRuleResponse> => {
  const { data } = await apiClient.post<AdminWeightRuleResponse>(`${BASE}/weight-rules`, payload);
  return data;
};

export const adminUpdateWeightRule = async (
  ruleId: string,
  payload: AdminUpdateWeightRulePayload
): Promise<AdminWeightRuleResponse> => {
  const { data } = await apiClient.put<AdminWeightRuleResponse>(`${BASE}/weight-rules/${ruleId}`, payload);
  return data;
};

export const adminGetScoringConfig = async (): Promise<AdminScoringConfigResponse> => {
  const { data } = await apiClient.get<AdminScoringConfigResponse>(`${BASE}/scoring-config`);
  return data;
};

export const adminUpdateScoringConfig = async (
  configId: string,
  payload: AdminUpdateScoringConfigPayload
): Promise<AdminScoringConfigResponse> => {
  const { data } = await apiClient.put<AdminScoringConfigResponse>(
    `${BASE}/scoring-config/${configId}`,
    payload
  );
  return data;
};

export const adminGetWaitingList = async (): Promise<AdminWaitingListEntry[]> => {
  const { data } = await apiClient.get<AdminWaitingListEntry[]>(`${BASE}/waiting-list`);
  return data;
};

export const adminNotifyWaitingList = async (
  cityName: string
): Promise<{ cityName: string; notifiedCount: number }> => {
  const { data } = await apiClient.post<{ cityName: string; notifiedCount: number }>(
    `${BASE}/waiting-list/${encodeURIComponent(cityName)}/notify`
  );
  return data;
};
