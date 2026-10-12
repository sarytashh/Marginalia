export function topicNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function questionPromptKey(prompt: string): string {
  return prompt
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDuplicateQuestionPrompt(
  candidate: string,
  existing: ReadonlySet<string>,
): boolean {
  const key = questionPromptKey(candidate);
  if (key === "") {
    return true;
  }
  if (existing.has(key)) {
    return true;
  }

  for (const seen of existing) {
    if (isNearDuplicatePrompt(key, seen)) {
      return true;
    }
  }

  return false;
}

function isNearDuplicatePrompt(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  if (shorter.length < 24) {
    return false;
  }

  if (longer.includes(shorter)) {
    return true;
  }

  return contentWordOverlap(left, right) >= REWORDED_OVERLAP;
}

// Rewordings such as "What does the loss function measure in linear
// regression?" and "What is the purpose of the loss function in linear
// regression?" share most content words. Numbers and symbols stay in the
// token set, so drill questions with different expressions are kept.
const REWORDED_OVERLAP = 0.65;
const MIN_CONTENT_WORDS = 4;
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "context", "does",
  "for", "from", "how", "in", "is", "it", "of", "on", "or", "the", "this",
  "to", "what", "when", "which", "why", "with",
]);

function contentWords(key: string): Set<string> {
  return new Set(key.split(" ").filter((word) => word !== "" && !STOP_WORDS.has(word)));
}

function contentWordOverlap(left: string, right: string): number {
  const a = contentWords(left);
  const b = contentWords(right);
  if (Math.min(a.size, b.size) < MIN_CONTENT_WORDS) {
    return 0;
  }

  let shared = 0;
  for (const word of a) {
    if (b.has(word)) {
      shared += 1;
    }
  }
  return shared / (a.size + b.size - shared);
}
