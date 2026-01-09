import { apiClient } from "../axiosConfig";
import type {
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
