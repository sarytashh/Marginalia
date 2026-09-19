import { z } from "zod";

import {
  MAX_QUESTIONS_PER_TOPIC,
  MAX_TOPICS_PER_DOCUMENT,
} from "@/lib/generation/limits";

const topicItemSchema = z
  .object({
    name: z.string().optional(),
    title: z.string().optional(),
    topic: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
  })
  .transform((item) => ({
    name: (item.name ?? item.title ?? item.topic ?? "").trim(),
    summary: (item.summary ?? item.description ?? "").trim(),
  }))
  .pipe(
    z.object({
      name: z.string().min(1).max(200),
      summary: z.string().min(1).max(800),
    }),
  );

const topicListSchema = z.array(topicItemSchema).max(MAX_TOPICS_PER_DOCUMENT);

export const topicExtractionSchema = z.union([
  z.object({ topics: topicListSchema }),
  z
    .object({ topic_list: topicListSchema })
    .transform((value) => ({ topics: value.topic_list })),
  topicListSchema.transform((topics) => ({ topics })),
  topicItemSchema.transform((topic) => ({ topics: [topic] })),
]);

const optionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value).trim()),
  text: z.string().trim().min(1),
  correct: z.boolean(),
});

const generatedQuestionSchema = z
  .object({
    kind: z.string(),
    prompt: z.string().trim().min(1),
    referenceAnswer: z.string().optional(),
    reference_answer: z.string().optional(),
    options: z.array(optionSchema).min(3).max(4).nullable().optional(),
    difficulty: z.coerce.number().int().min(1).max(3),
    sourceChunkIds: z.array(z.union([z.string(), z.number()])).optional(),
    source_chunk_ids: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .transform((question) => {
    const kind = normalizeQuestionKind(question.kind);
    const referenceAnswer = (
      question.referenceAnswer ??
      question.reference_answer ??
      ""
    ).trim();
    const sourceChunkIds = (question.sourceChunkIds ?? question.source_chunk_ids ?? []).map(
      (value) => String(value).trim(),
    );
    return {
      kind,
      prompt: question.prompt.trim(),
      referenceAnswer,
      options: question.options ?? null,
      difficulty: question.difficulty,
      sourceChunkIds,
    };
  })
  .pipe(
    z.object({
      kind: z.enum(["short_answer", "multiple_choice"]),
      prompt: z.string().min(1),
      referenceAnswer: z.string().min(1),
      options: z
        .array(
          z.object({
            id: z.string().min(1),
            text: z.string().min(1),
            correct: z.boolean(),
          }),
        )
        .min(3)
        .max(4)
        .nullable(),
      difficulty: z.number().int().min(1).max(3),
      sourceChunkIds: z.array(z.string().min(1)).min(1),
    }),
  );

export const questionGenerationSchema = z.union([
  z.object({ questions: z.array(generatedQuestionSchema).max(MAX_QUESTIONS_PER_TOPIC) }),
  z
    .array(generatedQuestionSchema)
    .max(MAX_QUESTIONS_PER_TOPIC)
    .transform((questions) => ({ questions })),
]);

export type ExtractedTopic = z.infer<typeof topicExtractionSchema>["topics"][number];
export type GeneratedQuestionDraft = z.infer<typeof generatedQuestionSchema>;

function normalizeQuestionKind(raw: string): "short_answer" | "multiple_choice" {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key.includes("multiple")) {
    return "multiple_choice";
  }
  return "short_answer";
}
