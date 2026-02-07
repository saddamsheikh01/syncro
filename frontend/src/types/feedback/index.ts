export type EarlyAccessFeedbackChoice =
  | "MORE_RELEVANT_MATCHES"
  | "MORE_PROFILES"
  | "CLEARER_EXPLANATIONS"
  | "SOMETHING_ELSE";

export type SubmitEarlyAccessFeedbackRequest = {
  choice: EarlyAccessFeedbackChoice;
  message?: string | null;
  activeSecondsBeforePrompt?: number | null;
};
