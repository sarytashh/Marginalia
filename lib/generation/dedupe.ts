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

  return longer.includes(shorter);
}
