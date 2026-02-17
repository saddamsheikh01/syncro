import { apiClient } from "../axiosConfig";
import type {
  AdminTestAnswerOptionRequest,
  AdminTestAnswerOptionResponse,
  AdminTestAnswerOptionUpdateRequest,
  AdminTestDefinitionRequest,
  AdminTestDefinitionResponse,
  AdminTestDefinitionUpdateRequest,
  AdminTestDetailResponse,
  AdminTestQuestionRequest,
  AdminTestQuestionResponse,
  AdminTestQuestionUpdateRequest,
  AdminTestTranslationResponse,
  AdminTestTranslationUpsertRequest,
  TestTranslationLocale,
} from "../../types/insights";
import type { Uuid } from "../../types/shared";

export const getAdminTests = async (): Promise<AdminTestDefinitionResponse[]> => {
  const { data } = await apiClient.get<AdminTestDefinitionResponse[]>(
    "/admin/tests"
  );
  return data;
};

export const getAdminTest = async (
  testId: Uuid
): Promise<AdminTestDetailResponse> => {
  const { data } = await apiClient.get<AdminTestDetailResponse>(
    `/admin/tests/${testId}`
  );
  return data;
};

export const createAdminTest = async (
  payload: AdminTestDefinitionRequest
): Promise<AdminTestDefinitionResponse> => {
  const { data } = await apiClient.post<AdminTestDefinitionResponse>(
    "/admin/tests",
    payload
  );
  return data;
};

export const updateAdminTest = async (
  testId: Uuid,
  payload: AdminTestDefinitionUpdateRequest
): Promise<AdminTestDefinitionResponse> => {
  const { data } = await apiClient.put<AdminTestDefinitionResponse>(
    `/admin/tests/${testId}`,
    payload
  );
  return data;
};

export const deleteAdminTest = async (testId: Uuid): Promise<void> => {
  await apiClient.delete(`/admin/tests/${testId}`);
};

export const createAdminQuestion = async (
  testId: Uuid,
  payload: AdminTestQuestionRequest
): Promise<AdminTestQuestionResponse> => {
  const { data } = await apiClient.post<AdminTestQuestionResponse>(
    `/admin/tests/${testId}/questions`,
    payload
  );
  return data;
};

export const updateAdminQuestion = async (
  testId: Uuid,
  questionId: Uuid,
  payload: AdminTestQuestionUpdateRequest
): Promise<AdminTestQuestionResponse> => {
  const { data } = await apiClient.put<AdminTestQuestionResponse>(
    `/admin/tests/${testId}/questions/${questionId}`,
    payload
  );
  return data;
};

export const deleteAdminQuestion = async (
  testId: Uuid,
  questionId: Uuid
): Promise<void> => {
  await apiClient.delete(`/admin/tests/${testId}/questions/${questionId}`);
};

export const createAdminAnswerOption = async (
  testId: Uuid,
  questionId: Uuid,
  payload: AdminTestAnswerOptionRequest
): Promise<AdminTestAnswerOptionResponse> => {
  const { data } = await apiClient.post<AdminTestAnswerOptionResponse>(
    `/admin/tests/${testId}/questions/${questionId}/options`,
    payload
  );
  return data;
};

export const updateAdminAnswerOption = async (
  testId: Uuid,
  questionId: Uuid,
  optionId: Uuid,
  payload: AdminTestAnswerOptionUpdateRequest
): Promise<AdminTestAnswerOptionResponse> => {
  const { data } = await apiClient.put<AdminTestAnswerOptionResponse>(
    `/admin/tests/${testId}/questions/${questionId}/options/${optionId}`,
    payload
  );
  return data;
};

export const deleteAdminAnswerOption = async (
  testId: Uuid,
  questionId: Uuid,
  optionId: Uuid
): Promise<void> => {
  await apiClient.delete(
    `/admin/tests/${testId}/questions/${questionId}/options/${optionId}`
  );
};

export const getAdminTestTranslations = async (
  testId: Uuid,
  locale: TestTranslationLocale
): Promise<AdminTestTranslationResponse> => {
  const { data } = await apiClient.get<AdminTestTranslationResponse>(
    `/admin/tests/${testId}/translations/${locale}`
  );
  return data;
};

export const upsertAdminTestTranslations = async (
  testId: Uuid,
  locale: TestTranslationLocale,
  payload: AdminTestTranslationUpsertRequest
): Promise<AdminTestTranslationResponse> => {
  const { data } = await apiClient.put<AdminTestTranslationResponse>(
    `/admin/tests/${testId}/translations/${locale}`,
    payload
  );
  return data;
};

export const autoTranslateAdminTest = async (
  testId: Uuid,
  locale: TestTranslationLocale
): Promise<AdminTestTranslationResponse> => {
  const { data } = await apiClient.post<AdminTestTranslationResponse>(
    `/admin/tests/${testId}/translations/${locale}/auto`,
    null,
    { timeout: 60000 }
  );
  return data;
};

export const autoTranslateAllAdminTest = async (
  testId: Uuid
): Promise<AdminTestTranslationResponse[]> => {
  const { data } = await apiClient.post<AdminTestTranslationResponse[]>(
    `/admin/tests/${testId}/translations/auto-all`,
    null,
    { timeout: 300000 }
  );
  return data;
};
