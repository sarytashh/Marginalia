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

const optionDraftSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
});

const generatedQuestionSchema = z
  .object({
    kind: z.string(),
    prompt: z.string().trim().min(1),
    referenceAnswer: z.string().optional(),
    reference_answer: z.string().optional(),
    options: z.unknown().optional(),
    choices: z.unknown().optional(),
    correctOption: z.union([z.string(), z.number()]).optional(),
    correct_option: z.union([z.string(), z.number()]).optional(),
    difficulty: z.coerce.number().int().min(1).max(3),
    sourceChunkIds: z.array(z.union([z.string(), z.number()])).optional(),
    source_chunk_ids: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .transform((question) => {
    const referenceAnswer = (
      question.referenceAnswer ??
      question.reference_answer ??
      ""
    ).trim();
    const sourceChunkIds = (question.sourceChunkIds ?? question.source_chunk_ids ?? []).map(
      (value) => String(value).trim(),
    );
    const markedCorrect = question.correctOption ?? question.correct_option;
    const options = coerceMultipleChoiceOptions(
      question.options ?? question.choices,
      referenceAnswer,
      markedCorrect === undefined ? undefined : String(markedCorrect),
    );
    let kind = normalizeQuestionKind(question.kind);
    if (kind === "multiple_choice" && options === null) {
      kind = "short_answer";
    }
    return {
      kind,
      prompt: question.prompt.trim(),
      referenceAnswer,
      options: kind === "multiple_choice" ? options : null,
      difficulty: question.difficulty,
      sourceChunkIds,
    };
  })
  .pipe(
    z.object({
      kind: z.enum(["short_answer", "multiple_choice"]),
      prompt: z.string().min(1),
      referenceAnswer: z.string().min(1),
      options: z.array(optionDraftSchema).min(3).max(4).nullable(),
      difficulty: z.number().int().min(1).max(3),
      sourceChunkIds: z.array(z.string().min(1)).min(1),
    }),
  );

export const questionGenerationSchema = z.union([
  z
    .object({ questions: z.array(z.unknown()) })
    .transform((value) => parseQuestionList(value.questions)),
  z.array(z.unknown()).transform((questions) => parseQuestionList(questions)),
]);

export type ExtractedTopic = z.infer<typeof topicExtractionSchema>["topics"][number];
export type GeneratedQuestionDraft = z.infer<typeof generatedQuestionSchema>;

function parseQuestionList(raw: unknown[]): { questions: GeneratedQuestionDraft[] } {
  const questions: GeneratedQuestionDraft[] = [];
  for (const item of raw) {
    const parsed = generatedQuestionSchema.safeParse(item);
    if (parsed.success) {
      questions.push(parsed.data);
    }
  }
  return { questions: questions.slice(0, MAX_QUESTIONS_PER_TOPIC) };
}

function normalizeQuestionKind(raw: string): "short_answer" | "multiple_choice" {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key.includes("multiple")) {
    return "multiple_choice";
  }
  return "short_answer";
}

const OPTION_IDS = ["A", "B", "C", "D"] as const;

export function coerceMultipleChoiceOptions(
  raw: unknown,
  referenceAnswer: string,
  markedCorrect?: string,
): { correct: boolean; id: string; text: string }[] | null {
  const drafts = optionDraftsFromUnknown(raw);
  if (drafts === null || drafts.length < 3 || drafts.length > 4) {
    return null;
  }

  const markedId = markedCorrect?.trim().toUpperCase();
  const reference = referenceAnswer.trim().toLowerCase();
  let assigned = drafts.map((draft) => {
    const id = draft.id.toUpperCase();
    const explicit = draft.correct;
    const marked = markedId !== undefined && (markedId === id || markedId === draft.text.toLowerCase());
    const mentioned = reference !== "" && reference.includes(draft.text.toLowerCase());
    return {
      id,
      text: draft.text,
      correct: explicit === true || marked || mentioned,
    };
  });

  const explicitCount = drafts.filter((draft) => draft.correct === true).length;
  if (explicitCount === 1) {
    assigned = drafts.map((draft) => ({
      id: draft.id.toUpperCase(),
      text: draft.text,
      correct: draft.correct === true,
    }));
  }

  const correctCount = assigned.filter((option) => option.correct).length;
  if (correctCount === 1) {
    return assigned;
  }
  if (correctCount > 1) {
    const longest = assigned
      .filter((option) => option.correct)
      .reduce((best, option) => (option.text.length > best.text.length ? option : best));
    return assigned.map((option) => ({
      ...option,
      correct: option.id === longest.id,
    }));
  }

  return null;
}

function optionDraftsFromUnknown(
  raw: unknown,
): { correct?: boolean; id: string; text: string }[] | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (Array.isArray(raw)) {
    const drafts: { correct?: boolean; id: string; text: string }[] = [];
    for (const [index, item] of raw.entries()) {
      const fallbackId = OPTION_IDS[index];
      if (fallbackId === undefined) {
        return null;
      }
      const draft = optionDraftFromUnknown(item, fallbackId);
      if (draft === null) {
        return null;
      }
      drafts.push(draft);
    }
    return drafts;
  }

  if (typeof raw !== "object") {
    return null;
  }

  const drafts: { correct?: boolean; id: string; text: string }[] = [];
  for (const [key, value] of Object.entries(raw)) {
    const draft = optionDraftFromUnknown(value, key);
    if (draft === null) {
      return null;
    }
    drafts.push(draft);
  }
  return drafts;
}

function optionDraftFromUnknown(
  raw: unknown,
  fallbackId: string,
): { correct?: boolean; id: string; text: string } | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    return text === "" ? null : { id: fallbackId, text };
  }
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const textValue = record.text ?? record.label ?? record.value;
  const text = typeof textValue === "string" ? textValue.trim() : "";
  if (text === "") {
    return null;
  }
  const idValue = record.id ?? record.key;
  const id = typeof idValue === "string" || typeof idValue === "number" ? String(idValue).trim() : fallbackId;
  const correct = typeof record.correct === "boolean" ? record.correct : undefined;
  return { id: id === "" ? fallbackId : id, text, correct };
}
