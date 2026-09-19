const SENTENCE_PATTERN = /[^.!?。！？]+[.!?。！？]?/g;

export function highlightSupportingSentence(
  excerpt: string,
  query: string,
): string | null {
  const trimmedExcerpt = excerpt.trim();
  if (trimmedExcerpt === "") {
    return null;
  }

  const sentences = splitSentences(trimmedExcerpt);
  if (sentences.length === 0) {
    return trimmedExcerpt;
  }

  const queryWords = significantWords(query);
  if (queryWords.size === 0) {
    return sentences[0] ?? trimmedExcerpt;
  }

  let best = sentences[0] ?? trimmedExcerpt;
  let bestScore = -1;
  for (const sentence of sentences) {
    const words = significantWords(sentence);
    let overlap = 0;
    for (const word of words) {
      if (queryWords.has(word)) {
        overlap += 1;
      }
    }
    if (overlap > bestScore) {
      best = sentence;
      bestScore = overlap;
    }
  }

  return best;
}

export function splitSentences(text: string): string[] {
  const matches = text.match(SENTENCE_PATTERN);
  if (matches === null) {
    return text.trim() === "" ? [] : [text.trim()];
  }
  return matches.map((sentence) => sentence.trim()).filter((sentence) => sentence !== "");
}

function significantWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 4);
  return new Set(words);
}
