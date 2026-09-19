import type { Json } from "@/lib/database.types";
import type { MultipleChoiceOption } from "@/lib/documents/types";

export function parseQuestionOptions(
  value: Json | null,
): MultipleChoiceOption[] | null {
  if (value === null || !Array.isArray(value)) {
    return null;
  }

  const options: MultipleChoiceOption[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const id = item.id;
    const text = item.text;
    const correct = item.correct;
    if (
      typeof id !== "string" ||
      typeof text !== "string" ||
      typeof correct !== "boolean"
    ) {
      return null;
    }
    options.push({ id, text, correct });
  }

  return options;
}

export function publicChoices(
  options: MultipleChoiceOption[] | null,
): { id: string; text: string }[] | null {
  if (options === null) {
    return null;
  }
  return options.map((option) => ({ id: option.id, text: option.text }));
}
