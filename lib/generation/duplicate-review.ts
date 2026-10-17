import { z } from "zod";

// After every topic has its questions, one model call reviews the whole list
// for questions that test the same idea in different words. Word-overlap
// checks miss these, and an embedding threshold would need tuning per model;
// the model can judge meaning directly. These pure helpers decide what to
// remove from its answer, defensively.

export const duplicateReviewSchema = z.object({
  duplicates: z
    .array(
      z.object({
        number: z.coerce.number().int(),
        duplicateOf: z.coerce.number().int(),
      }),
    )
    .default([]),
});

export type DuplicateVerdict = z.infer<typeof duplicateReviewSchema>["duplicates"][number];

export type ReviewedQuestion = {
  id: string;
  isNew: boolean;
  prompt: string;
  topicId: string;
};

/** At most this share of the newly written questions may be removed. */
export const MAX_REMOVED_SHARE = 0.4;

export function formatQuestionList(questions: readonly ReviewedQuestion[]): string {
  return questions.map((question, index) => `${index + 1}. ${question.prompt}`).join("\n");
}

/**
 * Ids to delete. Only new questions are removed (never ones a student may
 * already have practised), only when they repeat an earlier listed question,
 * never the last question of a topic, and never more than MAX_REMOVED_SHARE
 * of the new questions, in case the model over-reports.
 */
export function selectDuplicatesToRemove(
  questions: readonly ReviewedQuestion[],
  verdicts: readonly DuplicateVerdict[],
): string[] {
  const newCount = questions.filter((question) => question.isNew).length;
  const budget = Math.floor(newCount * MAX_REMOVED_SHARE);
  const remainingPerTopic = new Map<string, number>();
  for (const question of questions) {
    remainingPerTopic.set(question.topicId, (remainingPerTopic.get(question.topicId) ?? 0) + 1);
  }

  const removed = new Set<string>();
  const ordered = [...verdicts].sort((a, b) => a.number - b.number);
  for (const verdict of ordered) {
    if (removed.size >= budget) {
      break;
    }
    const question = questions[verdict.number - 1];
    const original = questions[verdict.duplicateOf - 1];
    if (
      question === undefined ||
      original === undefined ||
      verdict.duplicateOf >= verdict.number ||
      !question.isNew ||
      removed.has(question.id) ||
      removed.has(original.id)
    ) {
      continue;
    }
    const remaining = remainingPerTopic.get(question.topicId) ?? 0;
    if (remaining <= 1) {
      continue;
    }
    removed.add(question.id);
    remainingPerTopic.set(question.topicId, remaining - 1);
  }

  return [...removed];
}
