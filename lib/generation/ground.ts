import type { GeneratedQuestionDraft } from "@/lib/generation/schemas";

export type LabelableChunk = {
  content: string;
  id: string;
  pageNumber: number;
};

export type LabeledChunk = LabelableChunk & {
  label: string;
};

export type MultipleChoiceOption = {
  correct: boolean;
  id: string;
  text: string;
};

export type GroundedQuestion = {
  difficulty: number;
  kind: "short_answer" | "multiple_choice";
  options: MultipleChoiceOption[] | null;
  prompt: string;
  referenceAnswer: string;
  sourceChunkIds: string[];
};

export function chunkLabel(index: number): string {
  return `CHUNK_${String(index + 1).padStart(2, "0")}`;
}

export function labelChunks(chunks: readonly LabelableChunk[]): LabeledChunk[] {
  return chunks.map((chunk, index) => ({
    ...chunk,
    label: chunkLabel(index),
  }));
}

export function keepGroundedQuestions(
  drafts: readonly GeneratedQuestionDraft[],
  labeled: readonly LabeledChunk[],
): GroundedQuestion[] {
  const labelToId = new Map(labeled.map((chunk) => [chunk.label, chunk.id]));
  const idSet = new Set(labeled.map((chunk) => chunk.id));

  return drafts.flatMap((draft) => {
    const grounded = groundQuestion(draft, labelToId, idSet);
    return grounded === null ? [] : [grounded];
  });
}

function groundQuestion(
  draft: GeneratedQuestionDraft,
  labelToId: ReadonlyMap<string, string>,
  idSet: ReadonlySet<string>,
): GroundedQuestion | null {
  const prompt = draft.prompt.trim();
  const referenceAnswer = draft.referenceAnswer.trim();
  if (prompt === "" || referenceAnswer === "") {
    return null;
  }

  const sourceChunkIds = resolveSourceChunkIds(draft.sourceChunkIds, labelToId, idSet);
  if (sourceChunkIds.length === 0) {
    return null;
  }

  if (draft.kind === "multiple_choice") {
    const options = normalizeOptions(draft.options);
    if (options === null) {
      return null;
    }
    return {
      kind: "multiple_choice",
      prompt,
      referenceAnswer,
      options,
      difficulty: draft.difficulty,
      sourceChunkIds,
    };
  }

  return {
    kind: "short_answer",
    prompt,
    referenceAnswer,
    options: null,
    difficulty: draft.difficulty,
    sourceChunkIds,
  };
}

export function resolveSourceChunkIds(
  rawIds: readonly string[],
  labelToId: ReadonlyMap<string, string>,
  idSet: ReadonlySet<string>,
): string[] {
  const resolved: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawIds) {
    const chunkId = resolveOneSourceId(raw, labelToId, idSet);
    if (chunkId === null) {
      return [];
    }
    if (!seen.has(chunkId)) {
      seen.add(chunkId);
      resolved.push(chunkId);
    }
  }

  return resolved;
}

function resolveOneSourceId(
  raw: string,
  labelToId: ReadonlyMap<string, string>,
  idSet: ReadonlySet<string>,
): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  if (idSet.has(trimmed)) {
    return trimmed;
  }

  const label = normalizeChunkLabel(trimmed);
  if (label === null) {
    return null;
  }

  return labelToId.get(label) ?? null;
}

function normalizeChunkLabel(raw: string): string | null {
  const compact = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const match = /^CHUNK_?(\d{1,2})$/.exec(compact);
  const digits = match?.[1];
  if (digits === undefined) {
    return null;
  }
  return `CHUNK_${digits.padStart(2, "0")}`;
}

function normalizeOptions(
  options: GeneratedQuestionDraft["options"],
): MultipleChoiceOption[] | null {
  if (options === null || options === undefined) {
    return null;
  }
  if (options.length < 3 || options.length > 4) {
    return null;
  }

  const cleaned: MultipleChoiceOption[] = [];
  const texts = new Set<string>();

  for (const option of options) {
    const text = option.text.trim();
    const id = option.id.trim().toUpperCase();
    if (text === "" || id === "") {
      return null;
    }
    const textKey = text.toLowerCase();
    if (texts.has(textKey)) {
      return null;
    }
    texts.add(textKey);
    cleaned.push({ id, text, correct: option.correct });
  }

  const correctCount = cleaned.filter((option) => option.correct).length;
  if (correctCount !== 1) {
    return null;
  }

  return cleaned;
}
