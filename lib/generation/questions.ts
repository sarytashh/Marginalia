import "server-only";

import { completeStructured } from "@/lib/ai/complete-structured";
import { QUESTION_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/prompts/questions";
import {
  keepGroundedQuestions,
  labelChunks,
  type GroundedQuestion,
  type LabelableChunk,
} from "@/lib/generation/ground";
import { questionGenerationSchema } from "@/lib/generation/schemas";

const QUESTIONS_PER_TOPIC = 4;

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

  const existing =
    input.existingPrompts.length === 0
      ? "None yet."
      : input.existingPrompts.map((prompt) => `- ${prompt}`).join("\n");

  const result = await completeStructured({
    schema: questionGenerationSchema,
    system: QUESTION_GENERATION_SYSTEM_PROMPT,
    temperature: 0.2,
    user: `Topic: ${input.topicName}
Summary: ${input.topicSummary}

Write ${QUESTIONS_PER_TOPIC} questions if the passages can support them. Prefer short_answer. Include at most one multiple_choice question.

sourceChunkIds must use the CHUNK_01-style labels from the passages below. Do not invent labels. Do not duplicate these existing questions:
${existing}

Passages:
${passageBlock}

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

  const seenPrompts = new Set(
    input.existingPrompts.map((prompt) => prompt.trim().toLowerCase()),
  );

  const grounded = keepGroundedQuestions(result.questions, labeled);
  const unique: GroundedQuestion[] = [];
  for (const question of grounded) {
    const key = question.prompt.trim().toLowerCase();
    if (key === "" || seenPrompts.has(key)) {
      continue;
    }
    seenPrompts.add(key);
    unique.push(question);
  }
  return unique;
}
