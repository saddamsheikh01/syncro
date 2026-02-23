export type SupportCategory =
  | "GENERAL"
  | "BUG"
  | "FEATURE"
  | "ACCOUNT"
  | "OTHER";

export type SubmitSupportMessageRequest = {
  subject: string;
  message: string;
  category?: SupportCategory | null;
};
