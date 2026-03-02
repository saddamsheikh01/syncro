import type { IsoDateTime, JsonObject, Uuid } from "../shared";

export type ZyraMessageRole = "USER" | "ASSISTANT" | "SYSTEM";
export type ZyraSuggestionType =
  | "MATCH_OF_THE_DAY"
  | "PLACE_RECOMMENDATION"
  | "USER_RECOMMENDATION";

export type ZyraSessionResponse = {
  id: Uuid;
  userId: Uuid;
  title?: string | null;
  createdAt: IsoDateTime;
};

export type ZyraMessageResponse = {
  id: Uuid;
  sessionId: Uuid;
  role: ZyraMessageRole;
  content: string;
  createdAt: IsoDateTime;
};

export type ZyraChatResponse = {
  userMessage: ZyraMessageResponse;
  assistantMessage: ZyraMessageResponse;
  sessionTitle?: string | null;
};

export type ZyraMessageRequest = {
  content: string;
};

export type ZyraSuggestionRequest = {
  suggestionType: ZyraSuggestionType;
  context?: string | null;
};

export type ZyraSuggestionResponse = {
  id: Uuid;
  userId: Uuid;
  suggestionType: ZyraSuggestionType;
  payload: JsonObject | null;
  createdAt: IsoDateTime;
};

export type ZyraProfileRecapResponse = {
  recap: string;
  generatedAt: IsoDateTime;
};

export type ZyraPlaceRecapResponse = {
  recap: string;
  generatedAt: IsoDateTime;
};

export type ZyraChatRecapResponse = {
  recap: string;
  conversationCount: number;
  recentContacts: string[];
  generatedAt: IsoDateTime;
};

export type ZyraTestRecapResponse = {
  submissionId: Uuid;
  testTitle: string;
  testType: string;
  recap: string;
  generatedAt: IsoDateTime;
};
export type ZyraBirthChartPlacementInput = {
  sign: string;
  degreeInSign: number;
};

export type ZyraBirthChartInterpretationRequest = {
  sun: ZyraBirthChartPlacementInput;
  moon: ZyraBirthChartPlacementInput;
  ascendant?: ZyraBirthChartPlacementInput | null;
  venus: ZyraBirthChartPlacementInput;
  mars: ZyraBirthChartPlacementInput;
};

export type ZyraBirthChartInterpretationResponse = {
  interpretation: string;
};

