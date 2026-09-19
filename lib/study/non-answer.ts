const SURRENDER_PATTERNS: readonly RegExp[] = [
  /^(i\s+)?(really\s+|just\s+|honestly\s+)?(have\s+)?no\s+(idea|clue)(\s+at\s+all)?$/,
  /^(i\s+)?(do\s+not|dont)\s+know$/,
  /^(i\s+am\s+|im\s+)?not\s+sure$/,
  /^(idk|dunno|n\/a|na|none|nothing|pass|skip|whatever|beats me)$/,
  /^\?+$/,
  /^(不知道|我不知道|我不懂|不清楚|不会|我不会|没想法)$/,
];

const STOPWORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "answer",
  "answers",
  "anything",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "but",
  "clue",
  "did",
  "do",
  "does",
  "dont",
  "for",
  "from",
  "guess",
  "had",
  "has",
  "have",
  "honestly",
  "i",
  "idea",
  "idk",
  "if",
  "im",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "know",
  "like",
  "maybe",
  "me",
  "my",
  "no",
  "none",
  "not",
  "nothing",
  "of",
  "on",
  "or",
  "pass",
  "question",
  "questions",
  "really",
  "skip",
  "so",
  "something",
  "sorry",
  "sure",
  "than",
  "that",
  "the",
  "then",
  "these",
  "this",
  "those",
  "to",
  "uh",
  "um",
  "was",
  "we",
  "well",
  "were",
  "whatever",
  "with",
  "you",
  "your",
]);

export function isNonAnswer(answer: string): boolean {
  const normalized = normalizeAnswer(answer);
  if (normalized === "") {
    return true;
  }
  if (SURRENDER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  return contentWords(normalized).size === 0;
}

export function contentWords(text: string): Set<string> {
  const words = normalizeAnswer(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word));
  return new Set(words);
}

function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "'")
    .replace(/n'\b/g, "n")
    .replace(/n't\b/g, "nt")
    .replace(/i'm\b/g, "im")
    .replace(/[.!,?…。！？]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
