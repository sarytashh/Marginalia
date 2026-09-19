import "server-only";

import type { Tables } from "@/lib/database.types";
import { excerptPassage } from "@/lib/documents/format";
import { DocumentError } from "@/lib/documents/http";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import { getOwnedDocument } from "@/lib/documents/repository";
import {
  RECENT_MASTERY_LIMIT,
  topicMastery,
} from "@/lib/scheduler";
import { isSameLocalDay } from "@/lib/study/format";
import { publicChoices, parseQuestionOptions } from "@/lib/study/options";
import { parseStudySearchParams, hasInvalidStudyFilter, type StudySearchParams } from "@/lib/study/params";
import { selectSessionQuestions } from "@/lib/study/select";
import type {
  SessionCandidate,
  StudyQuestion,
  StudySessionMeta,
  StudySessionPayload,
  StudySessionScope,
} from "@/lib/study/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type QuestionRow = Tables<"questions">;
type TopicRow = Tables<"topics">;
type DocumentRow = Pick<Tables<"documents">, "id" | "title" | "user_id">;

export async function loadStudySession(
  searchParams: StudySearchParams,
): Promise<StudySessionPayload> {
  const parsed = parseStudySearchParams(searchParams);
  if (hasInvalidStudyFilter(searchParams)) {
    throw new DocumentError("That study link is not valid.", 400);
  }
  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();
  const now = new Date();
  const nowMs = now.getTime();

  const documents = await loadOwnedDocuments(ownerId, parsed.documentId);
  const documentIds = documents.map((document) => document.id);
  const documentsById = new Map(documents.map((document) => [document.id, document]));

  const emptyScope: StudySessionScope = {
    documentId: parsed.documentId,
    documentTitle:
      parsed.documentId === null
        ? null
        : (documentsById.get(parsed.documentId)?.title ?? null),
    includeAhead: parsed.includeAhead,
    lengthLabel: parsed.lengthLabel,
    limit: parsed.limit,
    questionId: parsed.questionId,
    topicId: parsed.topicId,
  };

  if (documentIds.length === 0) {
    return emptyPayload(emptyScope, null, 0);
  }

  const questionsResult = await supabase
    .from("questions")
    .select("*")
    .in("document_id", documentIds);

  if (questionsResult.error) {
    console.error(questionsResult.error);
    throw new DocumentError("Marginalia could not load your study session. Try again.", 500);
  }

  const questions = questionsResult.data ?? [];
  const questionIds = questions.map((question) => question.id);
  const topicIds = unique(questions.map((question) => question.topic_id));
  const chunkIds = unique(questions.flatMap((question) => question.source_chunk_ids));

  const [topicsResult, reviewsResult, attemptsResult, chunksResult] = await Promise.all([
    topicIds.length === 0
      ? Promise.resolve({ data: [] as TopicRow[], error: null })
      : supabase.from("topics").select("*").in("id", topicIds),
    questionIds.length === 0
      ? Promise.resolve({
          data: [] as { due_at: string | null; question_id: string }[],
          error: null,
        })
      : supabase
          .from("review_state")
          .select("question_id, due_at")
          .eq("user_id", ownerId)
          .in("question_id", questionIds),
    supabase
      .from("attempts")
      .select("question_id, created_at, score")
      .eq("user_id", ownerId),
    chunkIds.length === 0
      ? Promise.resolve({
          data: [] as { content: string; id: string; page_number: number }[],
          error: null,
        })
      : supabase.from("chunks").select("id, content, page_number").in("id", chunkIds),
  ]);

  if (topicsResult.error) {
    console.error(topicsResult.error);
    throw new DocumentError("Marginalia could not load your study session. Try again.", 500);
  }
  if (reviewsResult.error) {
    console.error(reviewsResult.error);
  }
  if (attemptsResult.error) {
    console.error(attemptsResult.error);
  }
  if (chunksResult.error) {
    console.error(chunksResult.error);
  }

  const topicsById = new Map((topicsResult.data ?? []).map((topic) => [topic.id, topic]));
  const dueAtByQuestion = new Map(
    (reviewsResult.data ?? []).map((row) => [row.question_id, row.due_at]),
  );
  const attempts = attemptsResult.data ?? [];
  const attemptCountByQuestion = new Map<string, number>();
  const attemptsByTopic = new Map<
    string,
    { at: number; score: number }[]
  >();
  const topicIdByQuestion = new Map(
    questions.map((question) => [question.id, question.topic_id]),
  );
  for (const attempt of attempts) {
    attemptCountByQuestion.set(
      attempt.question_id,
      (attemptCountByQuestion.get(attempt.question_id) ?? 0) + 1,
    );
    const topicId = topicIdByQuestion.get(attempt.question_id);
    if (topicId === undefined) {
      continue;
    }
    const topicAttempts = attemptsByTopic.get(topicId) ?? [];
    topicAttempts.push({
      at: Date.parse(attempt.created_at),
      score: attempt.score,
    });
    attemptsByTopic.set(topicId, topicAttempts);
  }
  const masteryByTopic = new Map<string, number>();
  for (const [topicId, topicAttempts] of attemptsByTopic) {
    topicAttempts.sort((left, right) => left.at - right.at);
    const recent = topicAttempts
      .slice(-RECENT_MASTERY_LIMIT)
      .map((attempt) => attempt.score);
    masteryByTopic.set(topicId, topicMastery(recent).value);
  }
  const chunksById = new Map((chunksResult.data ?? []).map((chunk) => [chunk.id, chunk]));

  const candidates: SessionCandidate[] = questions.map((question) => {
    const dueAt = dueAtByQuestion.get(question.id);
    return {
      id: question.id,
      documentId: question.document_id,
      topicId: question.topic_id,
      topicMastery: masteryByTopic.get(question.topic_id) ?? 0,
      dueAtMs: dueAt === undefined || dueAt === null ? null : Date.parse(dueAt),
      attemptCount: attemptCountByQuestion.get(question.id) ?? 0,
    };
  });

  const selected = selectSessionQuestions(candidates, {
    documentId: parsed.documentId,
    topicId: parsed.topicId,
    questionId: parsed.questionId,
    includeAhead: parsed.includeAhead,
    limit: parsed.limit,
    nowMs,
  });

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const studyQuestions: StudyQuestion[] = [];
  for (const candidate of selected) {
    const row = questionsById.get(candidate.id);
    const topic = topicsById.get(candidate.topicId);
    const document = documentsById.get(candidate.documentId);
    if (row === undefined || topic === undefined || document === undefined) {
      continue;
    }
    studyQuestions.push(
      mapStudyQuestion(row, topic, document, chunksById),
    );
  }

  const inScope = candidates.filter((candidate) =>
    matchesRequestScope(candidate, parsed.documentId, parsed.topicId, parsed.questionId),
  );
  const selectedIds = new Set(studyQuestions.map((question) => question.id));
  const remainingCount = candidates.filter(
    (candidate) =>
      matchesRequestScope(candidate, parsed.documentId, parsed.topicId, null) &&
      !selectedIds.has(candidate.id),
  ).length;
  const aheadAvailable = remainingCount > 0;

  const todayAttemptCount = attempts.filter((attempt) =>
    isSameLocalDay(attempt.created_at, now),
  ).length;

  const nextReviewAt = nextFutureDue(
    (reviewsResult.data ?? []).map((row) => row.due_at),
    nowMs,
  );

  const emptyReason =
    studyQuestions.length > 0
      ? null
      : inScope.length === 0
        ? "no-questions"
        : "caught-up";

  const meta: StudySessionMeta = {
    aheadAvailable,
    emptyReason,
    nextReviewAt,
    remainingCount,
    scope: emptyScope,
    todayAttemptCount,
  };

  return { questions: studyQuestions, meta };
}

async function loadOwnedDocuments(
  ownerId: string,
  documentId: string | null,
): Promise<DocumentRow[]> {
  if (documentId !== null) {
    const document = await getOwnedDocument(documentId);
    return [{ id: document.id, title: document.title, user_id: document.user_id }];
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, user_id")
    .eq("user_id", ownerId);

  if (error) {
    console.error(error);
    throw new DocumentError("Marginalia could not load your study session. Try again.", 500);
  }

  return data ?? [];
}

function mapStudyQuestion(
  question: QuestionRow,
  topic: TopicRow,
  document: DocumentRow,
  chunksById: ReadonlyMap<string, { content: string; id: string; page_number: number }>,
): StudyQuestion {
  const sourceChunks = question.source_chunk_ids.flatMap((chunkId) => {
    const chunk = chunksById.get(chunkId);
    return chunk === undefined ? [] : [chunk];
  });
  const sourcePages = unique(sourceChunks.map((chunk) => chunk.page_number));
  const firstChunk = sourceChunks[0];
  const options = parseQuestionOptions(question.options);

  return {
    id: question.id,
    prompt: question.prompt,
    kind: question.kind,
    options: question.kind === "multiple_choice" ? publicChoices(options) : null,
    topicId: topic.id,
    topicName: topic.name,
    documentId: document.id,
    documentTitle: document.title,
    sourcePages,
    sourceExcerpt: firstChunk === undefined ? null : excerptPassage(firstChunk.content),
  };
}

function matchesRequestScope(
  candidate: SessionCandidate,
  documentId: string | null,
  topicId: string | null,
  questionId: string | null,
): boolean {
  if (documentId && candidate.documentId !== documentId) {
    return false;
  }
  if (topicId && candidate.topicId !== topicId) {
    return false;
  }
  if (questionId && candidate.id !== questionId) {
    return false;
  }
  return true;
}

function nextFutureDue(dueAts: readonly (string | null)[], nowMs: number): string | null {
  let soonestFuture: number | null = null;
  let anyWaiting = false;
  for (const dueAt of dueAts) {
    if (dueAt === null) {
      anyWaiting = true;
      continue;
    }
    const parsed = Date.parse(dueAt);
    if (Number.isNaN(parsed)) {
      continue;
    }
    if (parsed <= nowMs) {
      anyWaiting = true;
      continue;
    }
    if (soonestFuture === null || parsed < soonestFuture) {
      soonestFuture = parsed;
    }
  }
  if (soonestFuture !== null) {
    return new Date(soonestFuture).toISOString();
  }
  if (anyWaiting) {
    return new Date(nowMs - 1).toISOString();
  }
  return null;
}

function emptyPayload(
  scope: StudySessionScope,
  nextReviewAt: string | null,
  todayAttemptCount: number,
): StudySessionPayload {
  return {
    questions: [],
    meta: {
      aheadAvailable: false,
      emptyReason: "no-questions",
      nextReviewAt,
      remainingCount: 0,
      scope,
      todayAttemptCount,
    },
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
