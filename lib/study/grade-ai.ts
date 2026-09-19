import "server-only";

import type { CompleteJson } from "@/lib/ai/complete-structured";
import { completeStructured } from "@/lib/ai/complete-structured";
import { extractJsonStringField } from "@/lib/ai/extract-json-field";
import { GRADING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { streamChatJson } from "@/lib/ai/stream-chat";
import { gradeModelSchema } from "@/lib/study/grade";
import type { ParsedGrade } from "@/lib/study/types";

export async function gradeShortAnswer(input: {
  completeJson?: CompleteJson;
  onExplanation?: (text: string) => void;
  onStatus?: (message: string) => void;
  prompt: string;
  referenceAnswer: string;
  sourcePassages: readonly { content: string; label: string; pageNumber: number }[];
  userAnswer: string;
}): Promise<ParsedGrade> {
  const passageBlock =
    input.sourcePassages.length === 0
      ? "(No source passages were stored for this question.)"
      : input.sourcePassages
          .map(
            (passage) =>
              `[${passage.label} | page ${passage.pageNumber}]\n${passage.content}`,
          )
          .join("\n\n");

  let calls = 0;
  const completeJson: CompleteJson =
    input.completeJson ??
    (async (request) => {
      calls += 1;
      if (calls > 1) {
        input.onStatus?.(
          "The study model is retrying. Your response is still here.",
        );
      }
      return streamChatJson({
        system: request.system,
        user: request.user,
        temperature: request.temperature,
        maxTokens: 2048,
        onText: (accumulated) => {
          const explanation = extractJsonStringField(accumulated, [
            "explanation",
            "feedback",
          ]);
          if (explanation !== null) {
            input.onExplanation?.(explanation);
          }
        },
      });
    });

  const result = await completeStructured({
    completeJson,
    schema: gradeModelSchema,
    system: GRADING_SYSTEM_PROMPT,
    temperature: 0,
    user: `Question:
${input.prompt}

Reference answer:
${input.referenceAnswer}

Student answer:
${input.userAnswer}

Passages:
${passageBlock}

Return JSON of the form:
{
  "explanation": "two to four sentences grounded in the passages",
  "whatYouGotRight": ["..."],
  "whatYouMissed": ["..."],
  "score": 0.7,
  "verdict": "partial"
}`,
  });

  return {
    ...result,
    correctChoiceId: null,
  };
}
