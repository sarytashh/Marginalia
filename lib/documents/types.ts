import type { Enums } from "@/lib/database.types";

export type DocumentStatus = Enums<"document_status">;
export type QuestionKind = Enums<"question_kind">;
export type MasteryState = "new" | "learning" | "shaky" | "solid";

export type DocumentCounts = {
  chunkCount: number;
  questionCount: number;
  topicCount: number;
};

export type LibraryDocument = {
  chunkCount: number;
  createdAt: string;
  errorMessage: string | null;
  filename: string;
  id: string;
  pageCount: number | null;
  questionCount: number;
  status: DocumentStatus;
  title: string;
  topicCount: number;
};

export type MultipleChoiceOption = {
  correct: boolean;
  id: string;
  text: string;
};

export type DocumentQuestion = {
  attemptCount: number;
  difficulty: number;
  id: string;
  kind: QuestionKind;
  latestScore: number | null;
  options: MultipleChoiceOption[] | null;
  prompt: string;
  referenceAnswer: string;
  sourceExcerpt: string | null;
  sourcePages: number[];
};

export type DocumentTopic = {
  dueCount: number;
  id: string;
  masteryState: MasteryState;
  masteryValue: number;
  name: string;
  questionCount: number;
  questions: DocumentQuestion[];
  summary: string;
};

export type DocumentDetail = {
  document: LibraryDocument;
  topics: DocumentTopic[];
};

export const DOCUMENTS_BUCKET = "documents";

export const EMPTY_DOCUMENT_COUNTS: DocumentCounts = {
  chunkCount: 0,
  questionCount: 0,
  topicCount: 0,
};
