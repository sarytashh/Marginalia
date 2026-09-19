import type { MasteryState } from "@/lib/scheduler";

export type ProgressTopic = {
  documentId: string;
  documentTitle: string;
  dueCount: number;
  id: string;
  masteryState: MasteryState;
  masteryValue: number;
  name: string;
  questionCount: number;
};

export type ProgressDay = {
  attemptCount: number;
  averageScore: number | null;
  day: string;
};

export type ProgressStreak = {
  current: number;
  longest: number;
  studyDays: number;
};

export type ProgressDashboard = {
  attemptCount: number;
  days: ProgressDay[];
  hasQuestions: boolean;
  streak: ProgressStreak;
  topics: ProgressTopic[];
};

export type ProgressSort = "weakest" | "due" | "document";
