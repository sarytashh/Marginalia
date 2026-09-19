import type { GradeFeedback } from "@/lib/study/types";

export type GradeStreamEvent =
  | { type: "status"; message: string }
  | { type: "explanation"; text: string }
  | { type: "result"; feedback: GradeFeedback }
  | { type: "error"; message: string };

export function encodeGradeStreamEvent(event: GradeStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export function parseGradeStreamEvent(line: string): GradeStreamEvent | null {
  const trimmed = line.trim();
  if (trimmed === "") {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || !("type" in parsed)) {
    return null;
  }

  const type = parsed.type;
  if (type === "status" && "message" in parsed && typeof parsed.message === "string") {
    return { type: "status", message: parsed.message };
  }
  if (type === "explanation" && "text" in parsed && typeof parsed.text === "string") {
    return { type: "explanation", text: parsed.text };
  }
  if (type === "error" && "message" in parsed && typeof parsed.message === "string") {
    return { type: "error", message: parsed.message };
  }
  if (type === "result" && "feedback" in parsed && isGradeFeedback(parsed.feedback)) {
    return { type: "result", feedback: parsed.feedback };
  }
  return null;
}

function isGradeFeedback(value: unknown): value is GradeFeedback {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.attemptId === "string" &&
    typeof record.score === "number" &&
    (record.verdict === "correct" ||
      record.verdict === "partial" ||
      record.verdict === "incorrect") &&
    Array.isArray(record.whatYouGotRight) &&
    Array.isArray(record.whatYouMissed) &&
    typeof record.explanation === "string" &&
    typeof record.referenceAnswer === "string" &&
    (typeof record.supportingSentence === "string" || record.supportingSentence === null) &&
    (typeof record.correctChoiceId === "string" || record.correctChoiceId === null) &&
    (typeof record.sourceExcerpt === "string" || record.sourceExcerpt === null)
  );
}
