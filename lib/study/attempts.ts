import "server-only";

import { AiError } from "@/lib/ai/errors";
import { excerptPassage } from "@/lib/documents/format";
import { DocumentError } from "@/lib/documents/http";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import { GRADE_FAILED_MESSAGE } from "@/lib/study/constants";
import { gradeShortAnswer } from "@/lib/study/grade-ai";
import {
  gradeMultipleChoice,
  serializeAttemptFeedback,
} from "@/lib/study/grade";
import { highlightSupportingSentence } from "@/lib/study/highlight";
import { matchQuestionChoice, parseQuestionOptions } from "@/lib/study/options";
import type { GradeFeedback, ParsedGrade } from "@/lib/study/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type GradeProgress = {
  onExplanation?: (text: string) => void;
  onStatus?: (message: string) => void;
};

export async function gradeAndRecordAttempt(
  input: {
    questionId: string;
    userAnswer: string;
  },
  progress: GradeProgress = {},
): Promise<GradeFeedback> {
  const answer = input.userAnswer.trim();
  if (answer === "") {
    throw new DocumentError("Write a few words before checking your answer.", 400);
  }

  const context = await loadGradeContext(input.questionId);
  const storedAnswer = storedUserAnswer(context, answer);
  const grade = await scoreAttempt(context, storedAnswer, progress);
  const supportingSentence =
    context.sourceExcerpt === null
      ? null
      : highlightSupportingSentence(
          context.sourceExcerpt,
          `${grade.explanation}\n${grade.whatYouMissed.join(" ")}`,
        );

  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();
  const { data: attempt, error: insertError } = await supabase
    .from("attempts")
    .insert({
      question_id: context.id,
      user_id: ownerId,
      user_answer: storedAnswer,
      score: grade.score,
      feedback: serializeAttemptFeedback(grade),
    })
    .select("id")
    .single();

  if (insertError || attempt === null) {
    console.error(insertError);
    throw new DocumentError(GRADE_FAILED_MESSAGE, 500);
  }

  return {
    ...grade,
    attemptId: attempt.id,
    referenceAnswer: context.referenceAnswer,
    sourceExcerpt: context.sourceExcerpt,
    supportingSentence,
  };
}

type GradeContext = {
  documentId: string;
  id: string;
  kind: "short_answer" | "multiple_choice";
  options: ReturnType<typeof parseQuestionOptions>;
  prompt: string;
  referenceAnswer: string;
  sourceExcerpt: string | null;
  sourcePassages: { content: string; label: string; pageNumber: number }[];
};

async function loadGradeContext(questionId: string): Promise<GradeContext> {
  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select(
      "id, kind, options, prompt, reference_answer, source_chunk_ids, document_id",
    )
    .eq("id", questionId)
    .maybeSingle();

  if (questionError) {
    console.error(questionError);
    throw new DocumentError(GRADE_FAILED_MESSAGE, 500);
  }
  if (question === null) {
    throw new DocumentError("That question is not in your library.", 404);
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id")
    .eq("id", question.document_id)
    .eq("user_id", ownerId)
    .maybeSingle();

  if (documentError) {
    console.error(documentError);
    throw new DocumentError(GRADE_FAILED_MESSAGE, 500);
  }
  if (document === null) {
    throw new DocumentError("That question is not in your library.", 404);
  }

  const chunkIds = question.source_chunk_ids;
  const chunksResult =
    chunkIds.length === 0
      ? { data: [] as { content: string; id: string; page_number: number }[], error: null }
      : await supabase
          .from("chunks")
          .select("id, content, page_number")
          .in("id", chunkIds);

  if (chunksResult.error) {
    console.error(chunksResult.error);
    throw new DocumentError(GRADE_FAILED_MESSAGE, 500);
  }

  const chunksById = new Map(
    (chunksResult.data ?? []).map((chunk) => [chunk.id, chunk]),
  );
  const sourcePassages = chunkIds.flatMap((chunkId, index) => {
    const chunk = chunksById.get(chunkId);
    if (chunk === undefined) {
      return [];
    }
    return [
      {
        content: chunk.content,
        label: `CHUNK_${String(index + 1).padStart(2, "0")}`,
        pageNumber: chunk.page_number,
      },
    ];
  });
  const firstChunk = sourcePassages[0];

  return {
    id: question.id,
    documentId: question.document_id,
    kind: question.kind,
    options: parseQuestionOptions(question.options),
    prompt: question.prompt,
    referenceAnswer: question.reference_answer,
    sourceExcerpt:
      firstChunk === undefined ? null : excerptPassage(firstChunk.content),
    sourcePassages,
  };
}

async function scoreAttempt(
  context: GradeContext,
  storedAnswer: string,
  progress: GradeProgress,
): Promise<ParsedGrade> {
  if (context.kind === "multiple_choice") {
    if (context.options === null) {
      throw new DocumentError(GRADE_FAILED_MESSAGE, 500);
    }
    try {
      return gradeMultipleChoice({
        options: context.options,
        referenceAnswer: context.referenceAnswer,
        userAnswer: storedAnswer,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Choose an option before checking your answer.";
      throw new DocumentError(message, 400);
    }
  }

  try {
    progress.onStatus?.("Reading your answer…");
    return await gradeShortAnswer({
      prompt: context.prompt,
      referenceAnswer: context.referenceAnswer,
      sourcePassages: context.sourcePassages,
      userAnswer: storedAnswer,
      onExplanation: progress.onExplanation,
      onStatus: progress.onStatus,
    });
  } catch (error) {
    console.error(error);
    throw toGradeError(error);
  }
}

function storedUserAnswer(context: GradeContext, answer: string): string {
  if (context.kind !== "multiple_choice") {
    return answer;
  }
  if (context.options === null) {
    return answer;
  }
  const match = matchQuestionChoice(context.options, answer);
  if (match === null) {
    throw new DocumentError("Choose an option before checking your answer.", 400);
  }
  return `${match.id}. ${match.text}`;
}

function toGradeError(error: unknown): DocumentError {
  if (error instanceof DocumentError) {
    return error;
  }
  if (error instanceof AiError) {
    return new DocumentError(error.message, error.retryable ? 503 : 502);
  }
  return new DocumentError(GRADE_FAILED_MESSAGE, 500);
}
