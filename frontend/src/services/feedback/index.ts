import { apiClient } from "../axiosConfig";
import type { SubmitEarlyAccessFeedbackRequest } from "../../types/feedback";

export const submitEarlyAccessFeedback = async (
  payload: SubmitEarlyAccessFeedbackRequest
): Promise<void> => {
  await apiClient.post("/feedback/early-access", payload);
};
