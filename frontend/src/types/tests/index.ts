import type { IsoDateTime, JsonObject, Uuid } from "../shared";

export type TestType =
  | "INTERESTS"
  | "LIFESTYLE"
  | "VALUES"
  | "OBJECTIVES"
  | "PSY"
  | "ASTRO"
  | "OTHER";

export type TestScoringStrategy =
  | "SINGLE_SCORE"
  | "CLUSTER_SCORE"
  | "AXES_SCORE";

export type TestQuestionType = "SINGLE" | "MULTI";

export type TestSummaryResponse = {
  id: Uuid;
  title: string;
  description: string | null;
  testType: TestType;
};

export type TestListResponse = {
  tests: TestSummaryResponse[];
};

export type TestAnswerOptionResponse = {
  id: Uuid;
  label: string;
  metadata?: JsonObject | null;
};

export type TestQuestionResponse = {
  id: Uuid;
  question: string;
  position: number;
  questionType: TestQuestionType;
  required: boolean;
  maxSelections?: number | null;
  options: TestAnswerOptionResponse[];
};

export type TestDetailResponse = {
  id: Uuid;
  title: string;
  description: string | null;
  testType: TestType;
  scoringStrategy: TestScoringStrategy;
  config: JsonObject;
  questions: TestQuestionResponse[];
};

export type TestAnswerRequest = {
  questionId: Uuid;
  answerOptionIds: Uuid[];
};

export type TestSubmissionRequest = {
  answers: TestAnswerRequest[];
};

export type TestCountResponse = {
  count: number;
};

export type AdminTestDefinitionRequest = {
  title: string;
  description?: string | null;
  active?: boolean | null;
  testType?: TestType | null;
  scoringStrategy?: TestScoringStrategy | null;
  config?: JsonObject | null;
};

export type AdminTestDefinitionUpdateRequest = {
  title?: string | null;
  description?: string | null;
  active?: boolean | null;
  testType?: TestType | null;
  scoringStrategy?: TestScoringStrategy | null;
  config?: JsonObject | null;
};

export type AdminTestDefinitionResponse = {
  id: Uuid;
  title: string;
  description: string | null;
  active: boolean;
  testType: TestType;
  scoringStrategy: TestScoringStrategy;
  config: JsonObject;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type AdminTestAnswerOptionDetailResponse = {
  id: Uuid;
  label: string;
  weight: number;
  metadata?: JsonObject | null;
};

export type AdminTestQuestionDetailResponse = {
  id: Uuid;
  question: string;
  position: number;
  questionType: TestQuestionType;
  required: boolean;
  maxSelections?: number | null;
  options: AdminTestAnswerOptionDetailResponse[];
};

export type AdminTestDetailResponse = {
  id: Uuid;
  title: string;
  description: string | null;
  active: boolean;
  testType: TestType;
  scoringStrategy: TestScoringStrategy;
  config: JsonObject;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  questions: AdminTestQuestionDetailResponse[];
};

export type AdminTestQuestionRequest = {
  question: string;
  position: number;
  questionType?: TestQuestionType | null;
  required?: boolean | null;
  maxSelections?: number | null;
};

export type AdminTestQuestionUpdateRequest = {
  question?: string | null;
  position?: number | null;
  questionType?: TestQuestionType | null;
  required?: boolean | null;
  maxSelections?: number | null;
};

export type AdminTestQuestionResponse = {
  id: Uuid;
  testId: Uuid;
  question: string;
  position: number;
  questionType: TestQuestionType;
  required: boolean;
  maxSelections?: number | null;
};

export type AdminTestAnswerOptionRequest = {
  label: string;
  weight: number;
  metadata?: JsonObject | null;
};

export type AdminTestAnswerOptionUpdateRequest = {
  label?: string | null;
  weight?: number | null;
  metadata?: JsonObject | null;
};

export type AdminTestAnswerOptionResponse = {
  id: Uuid;
  questionId: Uuid;
  label: string;
  weight: number;
  metadata?: JsonObject | null;
};
