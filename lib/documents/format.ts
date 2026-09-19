export function formatEditorialIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function formatQuestionKind(kind: "short_answer" | "multiple_choice"): string {
  return kind === "multiple_choice" ? "Multiple choice" : "Short answer";
}

export function formatDifficulty(difficulty: number): string {
  if (difficulty <= 1) {
    return "Introductory";
  }
  if (difficulty >= 3) {
    return "Challenging";
  }
  return "Standard";
}

export function formatMasteryState(
  state: "new" | "learning" | "shaky" | "solid",
): string {
  switch (state) {
    case "new":
      return "New";
    case "learning":
      return "Learning";
    case "shaky":
      return "Needs review";
    case "solid":
      return "Solid";
  }
}

export function formatSourcePages(pages: readonly number[]): string {
  const unique = [...new Set(pages)].sort((left, right) => left - right);
  if (unique.length === 0) {
    return "Source page unavailable";
  }
  if (unique.length === 1) {
    return `Page ${unique[0]}`;
  }
  if (unique.length === 2) {
    return `Pages ${unique[0]} and ${unique[1]}`;
  }
  const last = unique[unique.length - 1];
  const rest = unique.slice(0, -1).join(", ");
  return `Pages ${rest}, and ${last}`;
}

export function formatDueCount(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count === 1 ? "1 due" : `${count} due`;
}

export function formatQuestionCount(count: number): string {
  return count === 1 ? "1 question" : `${count} questions`;
}

export function formatTopicCount(count: number): string {
  return count === 1 ? "1 topic" : `${count} topics`;
}

export function formatLatestResult(score: number | null): string {
  if (score === null) {
    return "Not practiced";
  }
  if (score >= 0.8) {
    return "Correct";
  }
  if (score >= 0.5) {
    return "Partially correct";
  }
  return "Incorrect";
}

export function excerptPassage(content: string, maxCharacters = 420): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxCharacters) {
    return trimmed;
  }

  const sliced = trimmed.slice(0, maxCharacters);
  const lastSpace = sliced.lastIndexOf(" ");
  const clipped = lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced;
  return `${clipped.trim()}…`;
}
