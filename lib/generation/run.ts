import "server-only";

import pLimit from "p-limit";

import { AiError } from "@/lib/ai/errors";
import type { Json } from "@/lib/database.types";
import {
  QUESTIONS_FAILED_MESSAGE,
  SEARCH_INDEX_FAILED_MESSAGE,
  TOPICS_FAILED_MESSAGE,
} from "@/lib/documents/constants";
import { updateDocument } from "@/lib/documents/repository";
import {
  isDuplicateQuestionPrompt,
  questionPromptKey,
  topicNameKey,
} from "@/lib/generation/dedupe";
import {
  QUESTION_GENERATION_CONCURRENCY,
  QUESTION_RETRIEVAL_LIMIT,
} from "@/lib/generation/limits";
import { generateGroundedQuestions } from "@/lib/generation/questions";
import { extractTopicsFromChunks } from "@/lib/generation/topics";
import { searchChunks } from "@/lib/retrieval";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const generationLocks = new Set<string>();

type StoredTopic = {
  id: string;
  name: string;
  summary: string;
};

type StoredQuestion = {
  prompt: string;
  topic_id: string;
};

type StoredChunk = {
  content: string;
  id: string;
  page_number: number;
};

export async function generateStudyMaterial(
  documentId: string,
  userId: string,
  options: { replace?: boolean; topicId?: string } = {},
): Promise<void> {
  if (generationLocks.has(documentId)) {
    return;
  }
  generationLocks.add(documentId);

  try {
    await runStudyMaterialGeneration(documentId, userId, options);
  } finally {
    generationLocks.delete(documentId);
  }
}

async function runStudyMaterialGeneration(
  documentId: string,
  userId: string,
  options: { replace?: boolean; topicId?: string },
): Promise<void> {
  await updateDocument(documentId, {
    status: "generating",
    error_message: null,
  });

  try {
    const chunks = await loadDocumentChunks(documentId);
    if (chunks.length === 0) {
      await updateDocument(documentId, {
        status: "failed",
        error_message: SEARCH_INDEX_FAILED_MESSAGE,
      });
      return;
    }

    if (options.replace === true) {
      await deleteGeneratedStudyMaterial(documentId);
    }

    let topics = await loadTopics(documentId);
    if (topics.length === 0) {
      topics = await createTopics(documentId, chunks);
    }
    topics = await collapseDuplicateTopics(documentId);

    const selected = options.topicId
      ? topics.filter((topic) => topic.id === options.topicId)
      : topics;

    if (selected.length === 0) {
      await finishGeneration(
        documentId,
        options.topicId ? QUESTIONS_FAILED_MESSAGE : TOPICS_FAILED_MESSAGE,
      );
      return;
    }

    const existingQuestions = await loadQuestionPrompts(documentId);
    const existingPromptTexts = existingQuestions.map((question) => question.prompt);
    const seenPrompts = new Set(existingPromptTexts.map((prompt) => questionPromptKey(prompt)));
    const limit = pLimit(QUESTION_GENERATION_CONCURRENCY);

    await Promise.all(
      selected.map((topic) =>
        limit(async () => {
          try {
            const passages = await searchChunks(
              documentId,
              `${topic.name}. ${topic.summary}`,
              QUESTION_RETRIEVAL_LIMIT,
            );

            if (passages.length === 0) {
              console.error(`No retrieved passages for topic ${topic.id}`);
              return;
            }

            const questions = await generateGroundedQuestions({
              topicName: topic.name,
              topicSummary: topic.summary,
              existingPrompts: existingPromptTexts,
              passages,
            });

            const unique = questions.filter((question) => {
              if (isDuplicateQuestionPrompt(question.prompt, seenPrompts)) {
                return false;
              }
              seenPrompts.add(questionPromptKey(question.prompt));
              existingPromptTexts.push(question.prompt);
              return true;
            });

            await insertQuestions(documentId, userId, topic.id, unique);
          } catch (error) {
            console.error(error);
          }
        }),
      ),
    );

    const questionCount = await countQuestions(documentId);
    if (questionCount === 0) {
      await finishGeneration(documentId, QUESTIONS_FAILED_MESSAGE);
      return;
    }

    await updateDocument(documentId, {
      status: "ready",
      error_message: null,
    });
  } catch (error) {
    console.error(error);
    const topics = await loadTopics(documentId).catch(() => []);
    await finishGeneration(documentId, generationErrorMessage(error, topics.length));
  }
}

async function createTopics(
  documentId: string,
  chunks: StoredChunk[],
): Promise<StoredTopic[]> {
  const documentTitle = await loadDocumentTitle(documentId);
  const extracted = await extractTopicsFromChunks({
    documentTitle,
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      pageNumber: chunk.page_number,
    })),
  });

  const existing = await loadTopics(documentId);
  if (existing.length > 0) {
    return existing;
  }

  if (extracted.length === 0) {
    throw new Error(TOPICS_FAILED_MESSAGE);
  }

  const rows = extracted.map((topic) => ({
    id: crypto.randomUUID(),
    document_id: documentId,
    name: topic.name,
    summary: topic.summary,
  }));

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("topics").insert(rows);
  if (error) {
    console.error(error);
    throw new Error(TOPICS_FAILED_MESSAGE);
  }

  return rows;
}

async function collapseDuplicateTopics(documentId: string): Promise<StoredTopic[]> {
  const topics = await loadTopics(documentId);
  const kept: StoredTopic[] = [];
  const duplicateIds: string[] = [];
  const seen = new Set<string>();

  for (const topic of topics) {
    const key = topicNameKey(topic.name);
    if (key === "" || seen.has(key)) {
      duplicateIds.push(topic.id);
      continue;
    }
    seen.add(key);
    kept.push(topic);
  }

  if (duplicateIds.length === 0) {
    return kept;
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("topics").delete().in("id", duplicateIds);
  if (error) {
    console.error(error);
  }

  return kept;
}

async function insertQuestions(
  documentId: string,
  userId: string,
  topicId: string,
  questions: Awaited<ReturnType<typeof generateGroundedQuestions>>,
): Promise<void> {
  if (questions.length === 0) {
    return;
  }

  const supabase = createServiceRoleClient();

  for (const question of questions) {
    const questionId = crypto.randomUUID();
    const { error: questionError } = await supabase.from("questions").insert({
      id: questionId,
      document_id: documentId,
      topic_id: topicId,
      kind: question.kind,
      prompt: question.prompt,
      reference_answer: question.referenceAnswer,
      options: optionsToJson(question.options),
      source_chunk_ids: question.sourceChunkIds,
      difficulty: question.difficulty,
    });

    if (questionError) {
      console.error(questionError);
      throw new Error(QUESTIONS_FAILED_MESSAGE);
    }

    const { error: reviewError } = await supabase.from("review_state").insert({
      question_id: questionId,
      user_id: userId,
      ease: 2.5,
      interval_days: 0,
      repetitions: 0,
      due_at: new Date().toISOString(),
    });

    if (reviewError) {
      console.error(reviewError);
      throw new Error(QUESTIONS_FAILED_MESSAGE);
    }
  }
}

function optionsToJson(
  options: { correct: boolean; id: string; text: string }[] | null,
): Json | null {
  if (options === null) {
    return null;
  }

  return options.map((option) => ({
    id: option.id,
    text: option.text,
    correct: option.correct,
  }));
}

async function deleteGeneratedStudyMaterial(documentId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("topics").delete().eq("document_id", documentId);
  if (error) {
    console.error(error);
    throw new Error(TOPICS_FAILED_MESSAGE);
  }
}

async function loadDocumentChunks(documentId: string): Promise<StoredChunk[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("chunks")
    .select("id, content, page_number")
    .eq("document_id", documentId)
    .order("page_number", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error(TOPICS_FAILED_MESSAGE);
  }

  return data ?? [];
}

async function loadDocumentTitle(documentId: string): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("documents")
    .select("title")
    .eq("id", documentId)
    .maybeSingle();

  if (error || data === null) {
    console.error(error);
    return "Untitled material";
  }

  return data.title;
}

async function loadTopics(documentId: string): Promise<StoredTopic[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, summary")
    .eq("document_id", documentId);

  if (error) {
    console.error(error);
    throw new Error(TOPICS_FAILED_MESSAGE);
  }

  return data ?? [];
}

async function loadQuestionPrompts(documentId: string): Promise<StoredQuestion[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("questions")
    .select("topic_id, prompt")
    .eq("document_id", documentId);

  if (error) {
    console.error(error);
    throw new Error(QUESTIONS_FAILED_MESSAGE);
  }

  return data ?? [];
}

async function countQuestions(documentId: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);

  if (error) {
    console.error(error);
    throw new Error(QUESTIONS_FAILED_MESSAGE);
  }

  return count ?? 0;
}

async function finishGeneration(documentId: string, errorMessage: string): Promise<void> {
  const questionCount = await countQuestions(documentId);
  if (questionCount > 0) {
    await updateDocument(documentId, {
      status: "ready",
      error_message: null,
    });
    return;
  }

  await updateDocument(documentId, {
    status: "failed",
    error_message: errorMessage,
  });
}

function generationErrorMessage(error: unknown, topicCount: number): string {
  if (error instanceof Error && error.message === SEARCH_INDEX_FAILED_MESSAGE) {
    return SEARCH_INDEX_FAILED_MESSAGE;
  }
  if (error instanceof Error && error.message === TOPICS_FAILED_MESSAGE) {
    return TOPICS_FAILED_MESSAGE;
  }
  if (error instanceof Error && error.message === QUESTIONS_FAILED_MESSAGE) {
    return QUESTIONS_FAILED_MESSAGE;
  }
  if (error instanceof AiError && topicCount === 0) {
    return TOPICS_FAILED_MESSAGE;
  }
  return topicCount === 0 ? TOPICS_FAILED_MESSAGE : QUESTIONS_FAILED_MESSAGE;
}
