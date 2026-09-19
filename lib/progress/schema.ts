import { z } from "zod";

import type { ProgressDashboard } from "@/lib/progress/types";

const masteryStateSchema = z.enum(["new", "learning", "shaky", "solid"]);

const topicSchema = z.object({
  documentId: z.string().uuid(),
  documentTitle: z.string(),
  dueCount: z.coerce.number().int().nonnegative(),
  id: z.string().uuid(),
  masteryState: masteryStateSchema,
  masteryValue: z.coerce.number(),
  name: z.string(),
  questionCount: z.coerce.number().int().nonnegative(),
});

const daySchema = z.object({
  attemptCount: z.coerce.number().int().nonnegative(),
  averageScore: z
    .unknown()
    .transform((value) => {
      if (value === null || value === undefined) {
        return null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }),
  day: z.string(),
});

const streakSchema = z.object({
  current: z.coerce.number().int().nonnegative(),
  longest: z.coerce.number().int().nonnegative(),
  studyDays: z.coerce.number().int().nonnegative(),
});

export const progressDashboardSchema = z.object({
  attemptCount: z.coerce.number().int().nonnegative(),
  days: z.array(daySchema),
  hasQuestions: z.boolean(),
  streak: streakSchema,
  topics: z.array(topicSchema),
});

export function parseProgressDashboard(value: unknown): ProgressDashboard {
  return progressDashboardSchema.parse(value);
}
