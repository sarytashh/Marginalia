// Lecture PDFs carry pages that are not study material: copyright notices,
// tables of contents, and answer keys. Questions written from them ask about
// publishers and years ("In what year was it published by Pearson?") or
// garble exercise numbering. These checks run on passage text before it is
// given to the model for topics or questions.

const BOILERPLATE_LINE =
  /copyright|©|all rights reserved|\bisbn\b|library of congress|printed in |publishing as|this edition|permission of the publisher/i;

const MIN_STUDY_WORDS = 25;

function words(text: string): string[] {
  return text.match(/[\p{L}]{2,}/gu) ?? [];
}

/** Removes copyright and publishing sentences, keeping the rest of the page. */
export function stripBoilerplate(text: string): string {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((sentence) => !BOILERPLATE_LINE.test(sentence))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeAnswerKey(text: string): boolean {
  if (/\b(answers? to|solutions? to|answer key)\b/i.test(text)) {
    return true;
  }
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  const digits = (text.match(/\p{N}/gu) ?? []).length;
  const enumerations = (text.match(/\(\s*[a-h]\s*\)|\b\d+\.\s/g) ?? []).length;
  // Mostly numbers with dense "(a) (b) 1. 2." markers and little prose.
  return letters > 0 && digits / letters > 0.4 && enumerations >= 8;
}

function looksLikeTableOfContents(text: string): boolean {
  const leaders = (text.match(/\.{4,}|…{2,}/g) ?? []).length;
  if (leaders >= 4) {
    return true;
  }
  return /\b(table of )?contents\b/i.test(text) && (text.match(/\b\d{1,3}\b/g) ?? []).length >= 12;
}

/** Passage text ready for the model, or null when the page is not study material. */
export function studyText(text: string): string | null {
  const cleaned = stripBoilerplate(text);
  if (words(cleaned).length < MIN_STUDY_WORDS) {
    return null;
  }
  if (looksLikeAnswerKey(cleaned) || looksLikeTableOfContents(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Keeps study passages with boilerplate removed. Falls back to the original
 * list when filtering would leave nothing, so an unusual PDF still works.
 */
export function keepStudyPassages<T extends { content: string }>(passages: readonly T[]): T[] {
  const kept = passages.flatMap((passage) => {
    const text = studyText(passage.content);
    return text === null ? [] : [{ ...passage, content: text }];
  });
  return kept.length > 0 ? kept : [...passages];
}
