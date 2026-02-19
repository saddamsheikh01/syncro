import { apiClient } from "../axiosConfig";
import type { SubmitSupportMessageRequest } from "@/types/support";

export const submitSupportMessage = async (
  payload: SubmitSupportMessageRequest
): Promise<void> => {
  await apiClient.post("/support", payload);
};
