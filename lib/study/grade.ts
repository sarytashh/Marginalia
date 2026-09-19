import { z } from "zod";

import type { MultipleChoiceOption } from "@/lib/documents/types";
import { SCORE_CORRECT, SCORE_PARTIAL } from "@/lib/study/constants";
import { matchQuestionChoice } from "@/lib/study/options";
import type { GradeVerdict, ParsedGrade } from "@/lib/study/types";

const stringListSchema = z.array(z.unknown()).optional();

export const gradeModelSchema = z
  .object({
    score: z.coerce.number().optional(),
    verdict: z.unknown().optional(),
    whatYouGotRight: stringListSchema,
    what_you_got_right: stringListSchema,
    gotRight: stringListSchema,
    whatYouMissed: stringListSchema,
    what_you_missed: stringListSchema,
    missed: stringListSchema,
    explanation: z.unknown().optional(),
    feedback: z.unknown().optional(),
  })
  .transform((value) => {
    const score = normalizeScore(value.score ?? 0);
    const explanation = firstNonEmptyString([value.explanation, value.feedback]);
    const whatYouGotRight = normalizeStringList(
      value.whatYouGotRight ?? value.what_you_got_right ?? value.gotRight,
    );
    const whatYouMissed = normalizeStringList(
      value.whatYouMissed ?? value.what_you_missed ?? value.missed,
    );
    return {
      score,
      verdict: verdictFromScore(score),
      whatYouGotRight,
      whatYouMissed,
      explanation,
    };
  })
  .pipe(
    z.object({
      score: z.number().min(0).max(1),
      verdict: z.enum(["correct", "partial", "incorrect"]),
      whatYouGotRight: z.array(z.string()),
      whatYouMissed: z.array(z.string()),
      explanation: z.string().min(1),
    }),
  );

export type GradeModelResult = z.infer<typeof gradeModelSchema>;

export function verdictFromScore(score: number): GradeVerdict {
  if (score >= SCORE_CORRECT) {
    return "correct";
  }
  if (score >= SCORE_PARTIAL) {
    return "partial";
  }
  return "incorrect";
}

export function gradeMultipleChoice(input: {
  options: readonly MultipleChoiceOption[];
  referenceAnswer: string;
  userAnswer: string;
}): ParsedGrade {
  const selected = matchQuestionChoice(input.options, input.userAnswer);
  const correct = input.options.find((option) => option.correct) ?? null;

  if (selected === null || correct === null) {
    throw new Error("Choose an option before checking your answer.");
  }

  const isCorrect = selected.id === correct.id;
  const score = isCorrect ? 1 : 0;
  const explanation =
    input.referenceAnswer.trim() === ""
      ? `The source supports ${choiceLabel(correct)}.`
      : input.referenceAnswer.trim();

  return {
    score,
    verdict: verdictFromScore(score),
    whatYouGotRight: isCorrect
      ? [`You chose ${choiceLabel(selected)}.`]
      : [],
    whatYouMissed: isCorrect
      ? []
      : [`The option that matches the source is ${choiceLabel(correct)}.`],
    explanation,
    correctChoiceId: correct.id,
  };
}

export function gradeNonAnswer(referenceAnswer: string): ParsedGrade {
  const explanation =
    referenceAnswer.trim() === ""
      ? "This answer does not state the idea from the material."
      : `This answer does not state the idea from the material. ${referenceAnswer.trim()}`;

  return {
    score: 0,
    verdict: "incorrect",
    whatYouGotRight: [],
    whatYouMissed: ["The core idea from the source passages."],
    explanation,
    correctChoiceId: null,
  };
}
export function serializeAttemptFeedback(grade: ParsedGrade): string {
  return JSON.stringify({
    verdict: grade.verdict,
    whatYouGotRight: grade.whatYouGotRight,
    whatYouMissed: grade.whatYouMissed,
    explanation: grade.explanation,
  });
}

function normalizeScore(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  const scaled = raw > 1 ? raw / 100 : raw;
  if (scaled < 0) {
    return 0;
  }
  if (scaled > 1) {
    return 1;
  }
  return scaled;
}

function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    if (typeof raw === "string" && raw.trim() !== "") {
      return [clipString(raw.trim())];
    }
    return [];
  }

  const items: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") {
      continue;
    }
    const trimmed = item.trim();
    if (trimmed === "") {
      continue;
    }
    items.push(clipString(trimmed));
    if (items.length >= 6) {
      break;
    }
  }
  return items;
}

function firstNonEmptyString(values: readonly unknown[]): string {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") {
        return clipString(trimmed, 2000);
      }
    }
  }
  return "";
}

function clipString(value: string, max = 240): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function choiceLabel(option: MultipleChoiceOption): string {
  return `${option.id}. ${option.text}`;
}
