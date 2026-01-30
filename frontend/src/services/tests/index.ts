import { apiClient } from "../axiosConfig";
import type {
  TestCountResponse,
  TestDetailResponse,
  TestListResponse,
  TestSubmissionRequest,
} from "../../types/tests";
import type { Uuid } from "../../types/shared";

export const getTests = async (): Promise<TestListResponse> => {
  const { data } = await apiClient.get<TestListResponse>("/tests");
  return data;
};

export const getTest = async (testId: Uuid): Promise<TestDetailResponse> => {
  const { data } = await apiClient.get<TestDetailResponse>(`/tests/${testId}`);
  return data;
};

export const submitTest = async (
  testId: Uuid,
  payload: TestSubmissionRequest
): Promise<void> => {
  await apiClient.post(`/tests/${testId}/submit`, payload);
};

export const getMyTestsCount = async (): Promise<TestCountResponse> => {
  const { data } = await apiClient.get<TestCountResponse>("/tests/count");
  return data;
};

export const getUserTestsCount = async (
  userId: Uuid
): Promise<TestCountResponse> => {
  const { data } = await apiClient.get<TestCountResponse>(
    `/tests/users/${userId}/count`
  );
  return data;
};

export const resetMySubmissions = async (): Promise<void> => {
  await apiClient.delete("/tests/submissions/reset");
};
