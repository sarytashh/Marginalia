import "server-only";

import type { Json, Tables } from "@/lib/database.types";
import { excerptPassage } from "@/lib/documents/format";
import { DocumentError } from "@/lib/documents/http";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import { getOwnedLibraryDocument } from "@/lib/documents/repository";
import type {
  DocumentDetail,
  DocumentQuestion,
  DocumentTopic,
  MultipleChoiceOption,
} from "@/lib/documents/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type QuestionRow = Tables<"questions">;
type TopicRow = Tables<"topics">;

export async function getDocumentDetail(documentId: string): Promise<DocumentDetail> {
  const document = await getOwnedLibraryDocument(documentId);
  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();

  const [topicsResult, questionsResult] = await Promise.all([
    supabase.from("topics").select("*").eq("document_id", documentId),
    supabase.from("questions").select("*").eq("document_id", documentId),
  ]);

  if (topicsResult.error) {
    console.error(topicsResult.error);
    throw new DocumentError("Marginalia could not load this material. Try again.", 500);
  }
  if (questionsResult.error) {
    console.error(questionsResult.error);
    throw new DocumentError("Marginalia could not load this material. Try again.", 500);
  }

  const topics = topicsResult.data ?? [];
  const questions = questionsResult.data ?? [];
  const questionIds = questions.map((question) => question.id);
  const chunkIds = unique(
    questions.flatMap((question) => question.source_chunk_ids),
  );

  const [chunksResult, reviewsResult, attemptsResult] = await Promise.all([
    chunkIds.length === 0
      ? Promise.resolve({ data: [] as { content: string; id: string; page_number: number }[], error: null })
      : supabase
          .from("chunks")
          .select("id, content, page_number")
          .in("id", chunkIds),
    questionIds.length === 0
      ? Promise.resolve({ data: [] as { due_at: string | null; question_id: string }[], error: null })
      : supabase
          .from("review_state")
          .select("question_id, due_at")
          .eq("user_id", ownerId)
          .in("question_id", questionIds),
    questionIds.length === 0
      ? Promise.resolve({
          data: [] as { created_at: string; question_id: string; score: number }[],
          error: null,
        })
      : supabase
          .from("attempts")
          .select("question_id, score, created_at")
          .eq("user_id", ownerId)
          .in("question_id", questionIds)
          .order("created_at", { ascending: false }),
  ]);

  if (chunksResult.error) {
    console.error(chunksResult.error);
  }
  if (reviewsResult.error) {
    console.error(reviewsResult.error);
  }
  if (attemptsResult.error) {
    console.error(attemptsResult.error);
  }

  const chunksById = new Map(
    (chunksResult.data ?? []).map((chunk) => [chunk.id, chunk]),
  );
  const dueAtByQuestion = new Map(
    (reviewsResult.data ?? []).map((row) => [row.question_id, row.due_at]),
  );
  const attemptsByQuestion = groupAttempts(attemptsResult.data ?? []);
  const now = Date.now();

  const mappedTopics = topics.map((topic) =>
    mapTopic(
      topic,
      questions.filter((question) => question.topic_id === topic.id),
      chunksById,
      dueAtByQuestion,
      attemptsByQuestion,
      now,
    ),
  );

  mappedTopics.sort(compareDocumentOrder);

  return { document, topics: mappedTopics };
}

function mapTopic(
  topic: TopicRow,
  questions: QuestionRow[],
  chunksById: ReadonlyMap<string, { content: string; page_number: number }>,
  dueAtByQuestion: ReadonlyMap<string, string | null>,
  attemptsByQuestion: ReadonlyMap<string, { created_at: string; score: number }[]>,
  now: number,
): DocumentTopic {
  const mappedQuestions = questions
    .map((question) =>
      mapQuestion(
        question,
        chunksById,
        attemptsByQuestion.get(question.id) ?? [],
      ),
    )
    .sort((left, right) => left.prompt.localeCompare(right.prompt));

  const dueCount = questions.filter((question) => {
    const dueAt = dueAtByQuestion.get(question.id);
    if (dueAt === undefined || dueAt === null) {
      return true;
    }
    return Date.parse(dueAt) <= now;
  }).length;

  return {
    id: topic.id,
    name: topic.name,
    summary: topic.summary,
    questionCount: mappedQuestions.length,
    dueCount,
    masteryValue: 0,
    masteryState: "new",
    questions: mappedQuestions,
  };
}

function mapQuestion(
  question: QuestionRow,
  chunksById: ReadonlyMap<string, { content: string; page_number: number }>,
  attempts: readonly { created_at: string; score: number }[],
): DocumentQuestion {
  const sourceChunks = question.source_chunk_ids.flatMap((chunkId) => {
    const chunk = chunksById.get(chunkId);
    return chunk === undefined ? [] : [chunk];
  });
  const sourcePages = unique(sourceChunks.map((chunk) => chunk.page_number));
  const firstChunk = sourceChunks[0];

  return {
    id: question.id,
    kind: question.kind,
    prompt: question.prompt,
    referenceAnswer: question.reference_answer,
    options: parseOptions(question.options),
    difficulty: question.difficulty,
    sourcePages,
    sourceExcerpt: firstChunk === undefined ? null : excerptPassage(firstChunk.content),
    attemptCount: attempts.length,
    latestScore: attempts[0]?.score ?? null,
  };
}

function compareDocumentOrder(left: DocumentTopic, right: DocumentTopic): number {
  const leftPage = earliestPage(left);
  const rightPage = earliestPage(right);
  if (leftPage !== rightPage) {
    return leftPage - rightPage;
  }
  return left.name.localeCompare(right.name);
}

function earliestPage(topic: DocumentTopic): number {
  const pages = topic.questions.flatMap((question) => question.sourcePages);
  if (pages.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.min(...pages);
}

function groupAttempts(
  rows: readonly { created_at: string; question_id: string; score: number }[],
): Map<string, { created_at: string; score: number }[]> {
  const grouped = new Map<string, { created_at: string; score: number }[]>();
  for (const row of rows) {
    const current = grouped.get(row.question_id) ?? [];
    current.push({ created_at: row.created_at, score: row.score });
    grouped.set(row.question_id, current);
  }
  return grouped;
}

function parseOptions(value: Json | null): MultipleChoiceOption[] | null {
  if (value === null || !Array.isArray(value)) {
    return null;
  }

  const options: MultipleChoiceOption[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const id = item.id;
    const text = item.text;
    const correct = item.correct;
    if (
      typeof id !== "string" ||
      typeof text !== "string" ||
      typeof correct !== "boolean"
    ) {
      return null;
    }
    options.push({ id, text, correct });
  }

  return options;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
