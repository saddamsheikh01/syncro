import type { IsoDateTime, Uuid } from "../shared";

export type TestSummaryResponse = {
  id: Uuid;
  title: string;
  description: string | null;
};

export type TestListResponse = {
  tests: TestSummaryResponse[];
};

export type TestAnswerOptionResponse = {
  id: Uuid;
  label: string;
};

export type TestQuestionResponse = {
  id: Uuid;
  question: string;
  position: number;
  options: TestAnswerOptionResponse[];
};

export type TestDetailResponse = {
  id: Uuid;
  title: string;
  description: string | null;
  questions: TestQuestionResponse[];
};

export type TestAnswerRequest = {
  questionId: Uuid;
  answerOptionId: Uuid;
};

export type TestSubmissionRequest = {
  answers: TestAnswerRequest[];
};

export type AdminTestDefinitionRequest = {
  title: string;
  description?: string | null;
  active?: boolean | null;
};

export type AdminTestDefinitionUpdateRequest = {
  title?: string | null;
  description?: string | null;
  active?: boolean | null;
};

export type AdminTestDefinitionResponse = {
  id: Uuid;
  title: string;
  description: string | null;
  active: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type AdminTestAnswerOptionDetailResponse = {
  id: Uuid;
  label: string;
  weight: number;
};

export type AdminTestQuestionDetailResponse = {
  id: Uuid;
  question: string;
  position: number;
  options: AdminTestAnswerOptionDetailResponse[];
};

export type AdminTestDetailResponse = {
  id: Uuid;
  title: string;
  description: string | null;
  active: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  questions: AdminTestQuestionDetailResponse[];
};

export type AdminTestQuestionRequest = {
  question: string;
  position: number;
};

export type AdminTestQuestionUpdateRequest = {
  question?: string | null;
  position?: number | null;
};

export type AdminTestQuestionResponse = {
  id: Uuid;
  testId: Uuid;
  question: string;
  position: number;
};

export type AdminTestAnswerOptionRequest = {
  label: string;
  weight: number;
};

export type AdminTestAnswerOptionUpdateRequest = {
  label?: string | null;
  weight?: number | null;
};

export type AdminTestAnswerOptionResponse = {
  id: Uuid;
  questionId: Uuid;
  label: string;
  weight: number;
};
