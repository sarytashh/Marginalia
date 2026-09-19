import "server-only";

import { DocumentError } from "@/lib/documents/http";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import { assembleProgressDashboard } from "@/lib/progress/assemble";
import { parseProgressDashboard } from "@/lib/progress/schema";
import type { ProgressDashboard } from "@/lib/progress/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const TIME_ZONE_PATTERN = /^[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)*$/;

export async function loadProgressDashboard(): Promise<ProgressDashboard> {
  const ownerId = await getDocumentOwnerId();
  const timeZone = resolveTimeZone();
  const now = new Date();

  try {
    return await fetchDashboardRpc(ownerId, now, timeZone);
  } catch (error) {
    if (!isMissingRpc(error) && timeZone !== "UTC") {
      try {
        return await fetchDashboardRpc(ownerId, now, "UTC");
      } catch (retryError) {
        if (!isMissingRpc(retryError)) {
          throw toProgressError(retryError);
        }
      }
    } else if (!isMissingRpc(error)) {
      throw toProgressError(error);
    }
  }

  return fetchDashboardFromTables(ownerId, now, timeZone);
}

async function fetchDashboardRpc(
  userId: string,
  now: Date,
  timeZone: string,
): Promise<ProgressDashboard> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("progress_dashboard", {
    p_user_id: userId,
    p_now: now.toISOString(),
    p_time_zone: timeZone,
  });

  if (error) {
    if (isMissingRpcError(error)) {
      throw new MissingProgressRpcError();
    }
    console.error(error);
    throw new DocumentError(
      "Marginalia could not load your progress. Try again.",
      500,
    );
  }

  try {
    return parseProgressDashboard(data);
  } catch (caught) {
    console.error(caught);
    throw new DocumentError(
      "Marginalia could not load your progress. Try again.",
      500,
    );
  }
}

async function fetchDashboardFromTables(
  userId: string,
  now: Date,
  timeZone: string,
): Promise<ProgressDashboard> {
  const supabase = createServiceRoleClient();
  const documentsResult = await supabase
    .from("documents")
    .select("id, title")
    .eq("user_id", userId);

  if (documentsResult.error) {
    console.error(documentsResult.error);
    throw new DocumentError(
      "Marginalia could not load your progress. Try again.",
      500,
    );
  }

  const documents = documentsResult.data ?? [];
  const documentIds = documents.map((document) => document.id);
  if (documentIds.length === 0) {
    return assembleProgressDashboard({
      attempts: [],
      documents: [],
      now,
      questions: [],
      reviews: [],
      timeZone,
      topics: [],
    });
  }

  const [topicsResult, questionsResult, attemptsResult] = await Promise.all([
    supabase.from("topics").select("id, name, document_id").in("document_id", documentIds),
    supabase.from("questions").select("id, topic_id, document_id").in("document_id", documentIds),
    supabase
      .from("attempts")
      .select("question_id, score, created_at")
      .eq("user_id", userId),
  ]);

  if (topicsResult.error || questionsResult.error || attemptsResult.error) {
    console.error(topicsResult.error ?? questionsResult.error ?? attemptsResult.error);
    throw new DocumentError(
      "Marginalia could not load your progress. Try again.",
      500,
    );
  }

  const questions = questionsResult.data ?? [];
  const questionIds = questions.map((question) => question.id);
  const reviewsResult =
    questionIds.length === 0
      ? { data: [] as { due_at: string | null; question_id: string }[], error: null }
      : await supabase
          .from("review_state")
          .select("question_id, due_at")
          .eq("user_id", userId)
          .in("question_id", questionIds);

  if (reviewsResult.error) {
    console.error(reviewsResult.error);
    throw new DocumentError(
      "Marginalia could not load your progress. Try again.",
      500,
    );
  }

  return assembleProgressDashboard({
    attempts: (attemptsResult.data ?? []).map((attempt) => ({
      createdAt: attempt.created_at,
      questionId: attempt.question_id,
      score: attempt.score,
    })),
    documents,
    now,
    questions: questions.map((question) => ({
      documentId: question.document_id,
      id: question.id,
      topicId: question.topic_id,
    })),
    reviews: (reviewsResult.data ?? []).map((review) => ({
      dueAt: review.due_at,
      questionId: review.question_id,
    })),
    timeZone,
    topics: (topicsResult.data ?? []).map((topic) => ({
      documentId: topic.document_id,
      id: topic.id,
      name: topic.name,
    })),
  });
}

class MissingProgressRpcError extends Error {
  constructor() {
    super("progress_dashboard is not installed");
    this.name = "MissingProgressRpcError";
  }
}

function isMissingRpc(error: unknown): boolean {
  return error instanceof MissingProgressRpcError;
}

function isMissingRpcError(error: {
  code?: string;
  details?: string;
  message?: string;
}): boolean {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    /progress_dashboard/i.test(text) ||
    /could not find the function/i.test(text)
  );
}

function resolveTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && TIME_ZONE_PATTERN.test(timeZone)) {
      return timeZone;
    }
  } catch {
    return "UTC";
  }
  return "UTC";
}

function toProgressError(error: unknown): DocumentError {
  if (error instanceof DocumentError) {
    return error;
  }
  console.error(error);
  return new DocumentError(
    "Marginalia could not load your progress. Try again.",
    500,
  );
}
