import { apiClient } from "./axiosConfig";

export interface UserEmailPreferenceResponse {
  userId: string;
  chatEnabled: boolean;
  connectionsEnabled: boolean;
  matchEnabled: boolean;
  eventsEnabled: boolean;
  digestEnabled: boolean;
  contentWeeklyDigest: boolean;
  chatMinMinutesBetween: number;
  securityEnabled: boolean;
  testsProfileEnabled: boolean;
  feedMomentsEnabled: boolean;
}

export interface UpdateEmailPreferencesPayload {
  chatEnabled?: boolean;
  connectionsEnabled?: boolean;
  matchEnabled?: boolean;
  eventsEnabled?: boolean;
  digestEnabled?: boolean;
  contentWeeklyDigest?: boolean;
  chatMinMinutesBetween?: number;
  securityEnabled?: boolean;
  testsProfileEnabled?: boolean;
  feedMomentsEnabled?: boolean;
}

export const getEmailPreferences = async (): Promise<UserEmailPreferenceResponse> => {
  const { data } = await apiClient.get<UserEmailPreferenceResponse>(
    "/notifications/email-preferences"
  );
  return data;
};

export const updateEmailPreferences = async (
  payload: UpdateEmailPreferencesPayload
): Promise<UserEmailPreferenceResponse> => {
  const { data } = await apiClient.patch<UserEmailPreferenceResponse>(
    "/notifications/email-preferences",
    payload
  );
  return data;
};
