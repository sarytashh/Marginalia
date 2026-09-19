import "server-only";

import { completeStructured } from "@/lib/ai/complete-structured";
import { QUESTION_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/prompts/questions";
import {
  isDuplicateQuestionPrompt,
  questionPromptKey,
} from "@/lib/generation/dedupe";
import {
  keepGroundedQuestions,
  labelChunks,
  type GroundedQuestion,
  type LabelableChunk,
} from "@/lib/generation/ground";
import {
  MAX_MULTIPLE_CHOICE_PER_TOPIC,
  MAX_QUESTIONS_PER_TOPIC,
  MIN_MULTIPLE_CHOICE_PER_TOPIC,
  MIN_QUESTIONS_PER_TOPIC,
  TARGET_QUESTIONS_PER_TOPIC,
} from "@/lib/generation/limits";
import { questionGenerationSchema } from "@/lib/generation/schemas";

export async function generateGroundedQuestions(input: {
  existingPrompts: readonly string[];
  passages: readonly LabelableChunk[];
  topicName: string;
  topicSummary: string;
}): Promise<GroundedQuestion[]> {
  if (input.passages.length === 0) {
    return [];
  }

  const labeled = labelChunks(input.passages);
  const passageBlock = labeled
    .map(
      (chunk) =>
        `[${chunk.label} | page ${chunk.pageNumber}]\n${chunk.content}`,
    )
    .join("\n\n");

  const seen = new Set(input.existingPrompts.map((prompt) => questionPromptKey(prompt)));
  const unique: GroundedQuestion[] = [];

  const first = await requestQuestions({
    topicName: input.topicName,
    topicSummary: input.topicSummary,
    existingPrompts: input.existingPrompts,
    passageBlock,
    extraInstruction: null,
  });
  appendUniqueQuestions(unique, seen, keepGroundedQuestions(first, labeled));

  if (unique.length >= MIN_QUESTIONS_PER_TOPIC) {
    return unique.slice(0, MAX_QUESTIONS_PER_TOPIC);
  }

  const second = await requestQuestions({
    topicName: input.topicName,
    topicSummary: input.topicSummary,
    existingPrompts: [...input.existingPrompts, ...unique.map((question) => question.prompt)],
    passageBlock,
    extraInstruction: `You returned ${unique.length} usable question(s). Write ${MIN_QUESTIONS_PER_TOPIC} to ${MAX_QUESTIONS_PER_TOPIC} distinct questions covering different ideas from the passages. Include ${MIN_MULTIPLE_CHOICE_PER_TOPIC} to ${MAX_MULTIPLE_CHOICE_PER_TOPIC} multiple_choice items if the passages support distractors. Do not repeat or rephrase any existing prompt.`,
  });
  appendUniqueQuestions(unique, seen, keepGroundedQuestions(second, labeled));

  return unique.slice(0, MAX_QUESTIONS_PER_TOPIC);
}

async function requestQuestions(input: {
  existingPrompts: readonly string[];
  extraInstruction: string | null;
  passageBlock: string;
  topicName: string;
  topicSummary: string;
}) {
  const existing =
    input.existingPrompts.length === 0
      ? "None yet."
      : input.existingPrompts.map((prompt) => `- ${prompt}`).join("\n");

  const extra =
    input.extraInstruction === null ? "" : `\n\n${input.extraInstruction}\n`;

  const result = await completeStructured({
    schema: questionGenerationSchema,
    system: QUESTION_GENERATION_SYSTEM_PROMPT,
    temperature: input.extraInstruction === null ? 0.2 : 0.3,
    user: `Topic: ${input.topicName}
Summary: ${input.topicSummary}
${extra}
Write ${TARGET_QUESTIONS_PER_TOPIC} to ${MAX_QUESTIONS_PER_TOPIC} questions if the passages can support them. Include ${MIN_MULTIPLE_CHOICE_PER_TOPIC} to ${MAX_MULTIPLE_CHOICE_PER_TOPIC} multiple_choice questions with distractors taken from these passages. The rest should be short_answer.

sourceChunkIds must use the CHUNK_01-style labels from the passages below. Do not invent labels. Do not duplicate these existing questions:
${existing}

Passages:
${input.passageBlock}

Return JSON of the form:
{
  "questions": [
    {
      "kind": "short_answer",
      "prompt": "...",
      "referenceAnswer": "...",
      "options": null,
      "difficulty": 2,
      "sourceChunkIds": ["CHUNK_01"]
    }
  ]
}`,
  });

  return result.questions;
}

function appendUniqueQuestions(
  unique: GroundedQuestion[],
  seen: Set<string>,
  questions: readonly GroundedQuestion[],
): void {
  for (const question of questions) {
    if (isDuplicateQuestionPrompt(question.prompt, seen)) {
      continue;
    }
    seen.add(questionPromptKey(question.prompt));
    unique.push(question);
  }
}
