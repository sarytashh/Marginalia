import "server-only";

import pLimit from "p-limit";

import { AiError } from "@/lib/ai/errors";
import { completeStructured } from "@/lib/ai/complete-structured";
import { getChatEnv } from "@/lib/ai/env";
import { DUPLICATE_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts/duplicates";
import type { Json } from "@/lib/database.types";
import {
  NOT_ENOUGH_MATERIAL_MESSAGE,
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
  MIN_DOCUMENT_WORDS,
  QUESTION_GENERATION_CONCURRENCY,
  QUESTION_RETRIEVAL_LIMIT,
} from "@/lib/generation/limits";
import { generateGroundedQuestions } from "@/lib/generation/questions";
import {
  duplicateReviewSchema,
  formatQuestionList,
  selectDuplicatesToRemove,
  type ReviewedQuestion,
} from "@/lib/generation/duplicate-review";
import { keepStudyPassages } from "@/lib/generation/study-text";
import { selectTopicPassages } from "@/lib/generation/topic-passages";
import { countWords } from "@/lib/generation/word-count";
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
    const chatModel = getChatEnv().chatModel;
    console.info("generateStudyMaterial", {
      documentId,
      chatModel,
      replace: options.replace === true,
    });
    const chunks = await loadDocumentChunks(documentId);
    if (chunks.length === 0) {
      await updateDocument(documentId, {
        status: "failed",
        error_message: SEARCH_INDEX_FAILED_MESSAGE,
      });
      return;
    }

    if (options.topicId === undefined && countWords(chunks) < MIN_DOCUMENT_WORDS) {
      await finishGeneration(documentId, NOT_ENOUGH_MATERIAL_MESSAGE);
      return;
    }

    if (options.replace === true) {
      await deleteGeneratedStudyMaterial(documentId);
    }

    let topics = await loadTopics(documentId);
    if (topics.length === 0) {
      topics = await createTopics(documentId, keepStudyPassages(chunks));
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
    // Topics whose generation threw (model or network errors), as opposed to
    // topics where the model found nothing groundable to ask.
    let failedTopics = 0;
    const newQuestionIds: string[] = [];

    await Promise.all(
      selected.map((topic) =>
        limit(async () => {
          try {
            const passages = selectTopicPassages(
              keepStudyPassages(
                await searchChunks(
                  documentId,
                  `${topic.name}. ${topic.summary}`,
                  QUESTION_RETRIEVAL_LIMIT,
                ),
              ),
            );

            if (passages.length === 0) {
              console.error(`No retrieved passages for topic ${topic.id}`);
              return;
            }

            const questions = await generateGroundedQuestions({
              otherTopicNames: topics
                .filter((other) => other.id !== topic.id)
                .map((other) => other.name),
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

            newQuestionIds.push(...(await insertQuestions(documentId, userId, topic.id, unique)));
          } catch (error) {
            failedTopics += 1;
            console.error(error);
          }
        }),
      ),
    );

    await removeDuplicateQuestions(documentId, newQuestionIds);

    const questionCount = await countQuestions(documentId);
    if (questionCount === 0) {
      // The model answered for every topic but could not ground a single
      // question: retrying will not help, the material itself is too thin.
      const thinMaterial = failedTopics === 0 && options.topicId === undefined;
      await finishGeneration(
        documentId,
        thinMaterial ? NOT_ENOUGH_MATERIAL_MESSAGE : QUESTIONS_FAILED_MESSAGE,
      );
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
): Promise<string[]> {
  if (questions.length === 0) {
    return [];
  }

  const supabase = createServiceRoleClient();
  const insertedIds: string[] = [];

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
    insertedIds.push(questionId);
  }

  return insertedIds;
}

/**
 * One model call over every question in the material, removing new
 * questions that repeat an earlier one in different words. Best effort: if
 * the review fails, the questions are kept as they are.
 */
async function removeDuplicateQuestions(
  documentId: string,
  newQuestionIds: readonly string[],
): Promise<void> {
  if (newQuestionIds.length < 2) {
    return;
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("questions")
      .select("id, prompt, topic_id")
      .eq("document_id", documentId);
    if (error || data === null) {
      console.error(error);
      return;
    }

    const isNew = new Set(newQuestionIds);
    const order = new Map(newQuestionIds.map((id, index) => [id, index]));
    const existing = data.filter((row) => !isNew.has(row.id));
    const added = data
      .filter((row) => isNew.has(row.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    const questions: ReviewedQuestion[] = [...existing, ...added].map((row) => ({
      id: row.id,
      isNew: isNew.has(row.id),
      prompt: row.prompt,
      topicId: row.topic_id,
    }));

    const review = await completeStructured({
      schema: duplicateReviewSchema,
      system: DUPLICATE_REVIEW_SYSTEM_PROMPT,
      temperature: 0,
      user: `Questions:
${formatQuestionList(questions)}

Return JSON of the form:
{
  "duplicates": [{ "number": 7, "duplicateOf": 3 }]
}`,
    });

    const toRemove = selectDuplicatesToRemove(questions, review.duplicates);
    if (toRemove.length === 0) {
      return;
    }
    const { error: deleteError } = await supabase.from("questions").delete().in("id", toRemove);
    if (deleteError) {
      console.error(deleteError);
      return;
    }
    console.info("removeDuplicateQuestions", { documentId, removed: toRemove.length });
  } catch (error) {
    console.error(error);
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
  if (error instanceof AiError) {
    return error.message;
  }
  return topicCount === 0 ? TOPICS_FAILED_MESSAGE : QUESTIONS_FAILED_MESSAGE;
}

