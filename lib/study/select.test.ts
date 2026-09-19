import { describe, expect, it } from "vitest";

import { selectSessionQuestions, type SelectSessionOptions } from "@/lib/study/select";
import type { SessionCandidate } from "@/lib/study/types";

const NOW = Date.parse("2026-09-19T12:00:00.000Z");

function candidate(
  overrides: Partial<SessionCandidate> & Pick<SessionCandidate, "id">,
): SessionCandidate {
  return {
    attemptCount: 0,
    documentId: "doc-a",
    dueAtMs: NOW - 1,
    topicId: "topic-a",
    topicMastery: 0,
    ...overrides,
  };
}

const defaults: SelectSessionOptions = {
  includeAhead: false,
  limit: 10,
  nowMs: NOW,
};

describe("selectSessionQuestions", () => {
  it("returns due questions before anything else, capped at the session length", () => {
    const selected = selectSessionQuestions(
      [
        candidate({ id: "due-1", dueAtMs: NOW - 10 }),
        candidate({ id: "future", dueAtMs: NOW + 86_400_000 }),
        candidate({ id: "due-2", dueAtMs: NOW - 5 }),
      ],
      { ...defaults, limit: 10 },
    );

    expect(selected.map((item) => item.id)).toEqual(["due-1", "due-2"]);
  });

  it("sorts weaker topics first, then never-seen questions", () => {
    const selected = selectSessionQuestions(
      [
        candidate({
          id: "solid-seen",
          topicId: "solid",
          topicMastery: 0.9,
          attemptCount: 3,
          dueAtMs: NOW - 20,
        }),
        candidate({
          id: "weak-seen",
          topicId: "weak",
          topicMastery: 0.2,
          attemptCount: 2,
          dueAtMs: NOW - 10,
        }),
        candidate({
          id: "weak-new",
          topicId: "weak",
          topicMastery: 0.2,
          attemptCount: 0,
          dueAtMs: NOW - 5,
        }),
      ],
      defaults,
    );

    expect(selected.map((item) => item.id)).toEqual([
      "weak-new",
      "weak-seen",
      "solid-seen",
    ]);
  });

  it("does not fill a global due session with later reviews", () => {
    const selected = selectSessionQuestions(
      [
        candidate({ id: "due", dueAtMs: NOW - 1 }),
        candidate({ id: "later", dueAtMs: NOW + 86_400_000 }),
      ],
      { ...defaults, limit: 10, includeAhead: false },
    );

    expect(selected.map((item) => item.id)).toEqual(["due"]);
  });

  it("returns an empty list when nothing is due and ahead is off", () => {
    expect(
      selectSessionQuestions(
        [candidate({ id: "later", dueAtMs: NOW + 1_000 })],
        { ...defaults, includeAhead: false },
      ),
    ).toEqual([]);
  });

  it("studies ahead when asked, preferring never-seen questions", () => {
    const selected = selectSessionQuestions(
      [
        candidate({
          id: "seen",
          dueAtMs: NOW + 86_400_000,
          attemptCount: 4,
        }),
        candidate({
          id: "unseen",
          dueAtMs: NOW + 86_400_000,
          attemptCount: 0,
        }),
      ],
      { ...defaults, includeAhead: true, limit: 10 },
    );

    expect(selected.map((item) => item.id)).toEqual(["unseen", "seen"]);
  });

  it("fills a document-scoped session when nothing is due", () => {
    const selected = selectSessionQuestions(
      [
        candidate({
          id: "other-doc",
          documentId: "doc-b",
          dueAtMs: NOW + 1_000,
        }),
        candidate({
          id: "this-doc",
          documentId: "doc-a",
          dueAtMs: NOW + 1_000,
        }),
      ],
      { ...defaults, documentId: "doc-a", includeAhead: false },
    );

    expect(selected.map((item) => item.id)).toEqual(["this-doc"]);
  });

  it("restricts to one topic or one question", () => {
    const pool = [
      candidate({ id: "q1", topicId: "t1" }),
      candidate({ id: "q2", topicId: "t2" }),
    ];

    expect(
      selectSessionQuestions(pool, { ...defaults, topicId: "t2" }).map(
        (item) => item.id,
      ),
    ).toEqual(["q2"]);

    expect(
      selectSessionQuestions(pool, { ...defaults, questionId: "q1" }).map(
        (item) => item.id,
      ),
    ).toEqual(["q1"]);
  });

  it("honors a numeric limit and returns every match for all", () => {
    const pool = [
      candidate({ id: "a", dueAtMs: NOW - 3 }),
      candidate({ id: "b", dueAtMs: NOW - 2 }),
      candidate({ id: "c", dueAtMs: NOW - 1 }),
    ];

    expect(
      selectSessionQuestions(pool, { ...defaults, limit: 2 }).map((item) => item.id),
    ).toEqual(["a", "b"]);

    expect(
      selectSessionQuestions(pool, {
        ...defaults,
        limit: Number.POSITIVE_INFINITY,
      }).map((item) => item.id),
    ).toEqual(["a", "b", "c"]);
  });
});
