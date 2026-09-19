import "server-only";

import type { Json } from "@/lib/database.types";
import { DocumentError } from "@/lib/documents/http";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import {
  STUB_ATTEMPT_FEEDBACK,
  STUB_ATTEMPT_SCORE,
} from "@/lib/study/constants";
import { parseQuestionOptions } from "@/lib/study/options";
import type { RecordedAttempt } from "@/lib/study/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function recordStubAttempt(input: {
  questionId: string;
  userAnswer: string;
}): Promise<RecordedAttempt> {
  const answer = input.userAnswer.trim();
  if (answer === "") {
    throw new DocumentError("Write a few words before checking your answer.", 400);
  }

  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, kind, options, document_id")
    .eq("id", input.questionId)
    .maybeSingle();

  if (questionError) {
    console.error(questionError);
    throw new DocumentError(
      "Marginalia could not grade this answer right now. Your response is safe.",
      500,
    );
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
    throw new DocumentError(
      "Marginalia could not grade this answer right now. Your response is safe.",
      500,
    );
  }

  if (document === null) {
    throw new DocumentError("That question is not in your library.", 404);
  }

  const storedAnswer = storedUserAnswer(
    question.kind,
    question.options,
    answer,
  );

  const { data: attempt, error: insertError } = await supabase
    .from("attempts")
    .insert({
      question_id: question.id,
      user_id: ownerId,
      user_answer: storedAnswer,
      score: STUB_ATTEMPT_SCORE,
      feedback: STUB_ATTEMPT_FEEDBACK,
    })
    .select("id")
    .single();

  if (insertError || attempt === null) {
    console.error(insertError);
    throw new DocumentError(
      "Marginalia could not grade this answer right now. Your response is safe.",
      500,
    );
  }

  return { attemptId: attempt.id };
}

function storedUserAnswer(
  kind: "short_answer" | "multiple_choice",
  options: Json | null,
  answer: string,
): string {
  if (kind !== "multiple_choice") {
    return answer;
  }

  const parsed = parseQuestionOptions(options);
  if (parsed === null) {
    return answer;
  }

  const match = parsed.find(
    (option) =>
      option.id === answer ||
      option.text === answer ||
      option.id.toLowerCase() === answer.toLowerCase(),
  );

  if (match === undefined) {
    throw new DocumentError("Choose an option before checking your answer.", 400);
  }

  return `${match.id}. ${match.text}`;
}
