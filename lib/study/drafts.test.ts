import { describe, expect, it } from "vitest";

import {
  DRAFT_MAX_AGE_MS,
  clearDraft,
  draftKey,
  pruneDrafts,
  readDraft,
  writeDraft,
} from "@/lib/study/drafts";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    map,
  };
}

describe("study drafts", () => {
  it("round-trips a draft for a question", () => {
    const storage = memoryStorage();
    writeDraft(storage, "q1", "Dijkstra fails on negative edges", 1000);
    expect(readDraft(storage, "q1", 2000)).toBe("Dijkstra fails on negative edges");
  });

  it("removes the entry instead of storing blank text", () => {
    const storage = memoryStorage();
    writeDraft(storage, "q1", "something", 1000);
    writeDraft(storage, "q1", "   ", 1000);
    expect(storage.map.has(draftKey("q1"))).toBe(false);
  });

  it("drops drafts older than the maximum age", () => {
    const storage = memoryStorage();
    writeDraft(storage, "q1", "old answer", 0);
    expect(readDraft(storage, "q1", DRAFT_MAX_AGE_MS + 1)).toBeNull();
  });

  it("treats corrupt entries as no draft", () => {
    const storage = memoryStorage({ [draftKey("q1")]: "{not json" });
    expect(readDraft(storage, "q1")).toBeNull();
  });

  it("clears one draft without touching others", () => {
    const storage = memoryStorage();
    writeDraft(storage, "q1", "a", 1);
    writeDraft(storage, "q2", "b", 1);
    clearDraft(storage, "q1");
    expect(readDraft(storage, "q1", 2)).toBeNull();
    expect(readDraft(storage, "q2", 2)).toBe("b");
  });

  it("prunes only expired or corrupt draft keys", () => {
    const storage = memoryStorage({
      "marginalia.sessionLength": "10",
      [draftKey("bad")]: "nope",
    });
    writeDraft(storage, "fresh", "keep me", DRAFT_MAX_AGE_MS);
    writeDraft(storage, "stale", "drop me", 0);
    pruneDrafts(storage, DRAFT_MAX_AGE_MS + 1);
    expect([...storage.map.keys()].sort()).toEqual(
      [draftKey("fresh"), "marginalia.sessionLength"].sort(),
    );
  });
});
