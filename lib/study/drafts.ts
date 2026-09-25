// Unsubmitted short answers are kept in localStorage so a refresh, crash, or
// closed tab never loses what the student wrote. A draft is removed as soon as
// its attempt is stored, and drafts older than DRAFT_MAX_AGE_MS are pruned.

export const DRAFT_KEY_PREFIX = "marginalia.draft.";

export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

type StoredDraft = {
  savedAt: number;
  text: string;
};

export function draftKey(questionId: string): string {
  return `${DRAFT_KEY_PREFIX}${questionId}`;
}

function parseDraft(raw: string | null): StoredDraft | null {
  if (raw === null) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "text" in value &&
      "savedAt" in value &&
      typeof value.text === "string" &&
      typeof value.savedAt === "number"
    ) {
      return { text: value.text, savedAt: value.savedAt };
    }
  } catch {
    // A corrupt entry is treated as no draft.
  }
  return null;
}

export function readDraft(
  storage: DraftStorage,
  questionId: string,
  now: number = Date.now(),
): string | null {
  // Pure read: safe to call during render. pruneDrafts removes expired keys.
  const draft = parseDraft(storage.getItem(draftKey(questionId)));
  if (draft === null) {
    return null;
  }
  if (now - draft.savedAt > DRAFT_MAX_AGE_MS || draft.text.trim() === "") {
    return null;
  }
  return draft.text;
}

export function writeDraft(
  storage: DraftStorage,
  questionId: string,
  text: string,
  now: number = Date.now(),
): void {
  const key = draftKey(questionId);
  if (text.trim() === "") {
    storage.removeItem(key);
    return;
  }
  const value: StoredDraft = { text, savedAt: now };
  storage.setItem(key, JSON.stringify(value));
}

export function clearDraft(storage: DraftStorage, questionId: string): void {
  storage.removeItem(draftKey(questionId));
}

export function pruneDrafts(storage: DraftStorage, now: number = Date.now()): void {
  const expired: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key === null || !key.startsWith(DRAFT_KEY_PREFIX)) {
      continue;
    }
    const draft = parseDraft(storage.getItem(key));
    if (draft === null || now - draft.savedAt > DRAFT_MAX_AGE_MS) {
      expired.push(key);
    }
  }
  for (const key of expired) {
    storage.removeItem(key);
  }
}

// Storage can throw in private browsing or when full. Callers use this so a
// storage failure never interrupts studying.
export function browserDraftStorage(): DraftStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

// Lets useSyncExternalStore pick up drafts written in another tab.
export function subscribeToDrafts(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key.startsWith(DRAFT_KEY_PREFIX)) {
      onChange();
    }
  }
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
