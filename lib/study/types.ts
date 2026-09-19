import type { QuestionKind } from "@/lib/documents/types";

export type StudyChoice = {
  id: string;
  text: string;
};

export type StudyQuestion = {
  documentId: string;
  documentTitle: string;
  id: string;
  kind: QuestionKind;
  options: StudyChoice[] | null;
  prompt: string;
  sourceExcerpt: string | null;
  sourcePages: number[];
  topicId: string;
  topicName: string;
};

export type SessionCandidate = {
  attemptCount: number;
  documentId: string;
  dueAtMs: number | null;
  id: string;
  topicId: string;
  topicMastery: number;
};

export type StudySessionScope = {
  documentId: string | null;
  documentTitle: string | null;
  includeAhead: boolean;
  lengthLabel: number | "all";
  limit: number;
  questionId: string | null;
  topicId: string | null;
};

export type StudySessionMeta = {
  aheadAvailable: boolean;
  emptyReason: "no-questions" | "caught-up" | null;
  nextReviewAt: string | null;
  remainingCount: number;
  scope: StudySessionScope;
  todayAttemptCount: number;
};

export type StudySessionPayload = {
  meta: StudySessionMeta;
  questions: StudyQuestion[];
};

export type GradeVerdict = "correct" | "partial" | "incorrect";

export type ParsedGrade = {
  correctChoiceId: string | null;
  explanation: string;
  score: number;
  verdict: GradeVerdict;
  whatYouGotRight: string[];
  whatYouMissed: string[];
};

export type GradeFeedback = ParsedGrade & {
  attemptId: string;
  referenceAnswer: string;
  sourceExcerpt: string | null;
  supportingSentence: string | null;
};

export type SessionTopicResult = {
  name: string;
  verdict: GradeVerdict;
};
