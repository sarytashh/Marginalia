const SMALL_COUNTS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

export function formatLibraryHeading(
  dueCount: number,
  questionCount: number,
): string {
  if (dueCount > 0) {
    if (dueCount === 1) {
      return "One question is waiting.";
    }
    return `${capitalize(countWord(dueCount))} questions are waiting.`;
  }

  if (questionCount > 0) {
    return "You are caught up.";
  }

  return "Your materials.";
}

export function formatLibrarySummary(
  dueCount: number,
  questionCount: number,
): string {
  if (dueCount > 0) {
    return dueCount === 1
      ? "Start with the question already scheduled for review."
      : "Start the review that is already scheduled, or add another lecture PDF.";
  }

  if (questionCount > 0) {
    return "Nothing is waiting. You can still study ahead, or add another lecture PDF.";
  }

  return "Add a lecture PDF, or wait while Marginalia finishes reading a document already in the list.";
}

export function formatDueNavLabel(dueCount: number): string | null {
  if (dueCount <= 0) {
    return null;
  }
  return dueCount === 1 ? "1 due" : `${dueCount} due`;
}

function countWord(count: number): string {
  if (count >= 0 && count < SMALL_COUNTS.length) {
    return SMALL_COUNTS[count] ?? String(count);
  }
  return String(count);
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}
