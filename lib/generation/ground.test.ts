import { describe, expect, it } from "vitest";

import {
  keepGroundedQuestions,
  labelChunks,
  resolveSourceChunkIds,
} from "@/lib/generation/ground";
import type { GeneratedQuestionDraft } from "@/lib/generation/schemas";

const CHUNK_A = "11111111-1111-4111-8111-111111111111";
const CHUNK_B = "22222222-2222-4222-8222-222222222222";

const labeled = labelChunks([
  { id: CHUNK_A, content: "Dijkstra uses a priority queue.", pageNumber: 2 },
  { id: CHUNK_B, content: "Bellman-Ford handles negative weights.", pageNumber: 3 },
]);

function draft(
  overrides: Partial<GeneratedQuestionDraft> = {},
): GeneratedQuestionDraft {
  return {
    kind: "short_answer",
    prompt: "When does Dijkstra find shortest paths?",
    referenceAnswer: "When every edge weight is non-negative.",
    options: null,
    difficulty: 2,
    sourceChunkIds: ["CHUNK_01"],
    ...overrides,
  };
}

describe("labelChunks", () => {
  it("uses CHUNK_01-style labels in document order", () => {
    expect(labeled.map((chunk) => chunk.label)).toEqual(["CHUNK_01", "CHUNK_02"]);
  });
});

describe("resolveSourceChunkIds", () => {
  const labelToId = new Map(labeled.map((chunk) => [chunk.label, chunk.id]));
  const idSet = new Set(labeled.map((chunk) => chunk.id));

  it("maps labels and accepts raw chunk ids", () => {
    expect(resolveSourceChunkIds(["chunk-1", CHUNK_B], labelToId, idSet)).toEqual([
      CHUNK_A,
      CHUNK_B,
    ]);
  });

  it("drops the whole citation list if any id is unknown", () => {
    expect(resolveSourceChunkIds(["CHUNK_01", "CHUNK_99"], labelToId, idSet)).toEqual(
      [],
    );
  });
});

describe("keepGroundedQuestions", () => {
  it("keeps a short-answer question cited against provided passages", () => {
    const [question] = keepGroundedQuestions([draft()], labeled);
    expect(question?.sourceChunkIds).toEqual([CHUNK_A]);
    expect(question?.options).toBeNull();
  });

  it("drops a question that cites a chunk that was not retrieved", () => {
    expect(
      keepGroundedQuestions([draft({ sourceChunkIds: ["CHUNK_09"] })], labeled),
    ).toEqual([]);
  });

  it("drops a question with an empty prompt even if citations are valid", () => {
    expect(
      keepGroundedQuestions([draft({ prompt: "   " })], labeled),
    ).toEqual([]);
  });

  it("keeps multiple choice only when exactly one option is correct", () => {
    const options = [
      { id: "A", text: "Priority queue", correct: true },
      { id: "B", text: "Negative cycle", correct: false },
      { id: "C", text: "DFS forest", correct: false },
      { id: "D", text: "Bellman-Ford", correct: false },
    ];

    const [valid] = keepGroundedQuestions(
      [draft({ kind: "multiple_choice", options })],
      labeled,
    );
    expect(valid?.kind).toBe("multiple_choice");
    expect(valid?.options).toHaveLength(4);

    expect(
      keepGroundedQuestions(
        [
          draft({
            kind: "multiple_choice",
            options: options.map((option) => ({ ...option, correct: true })),
          }),
        ],
        labeled,
      ),
    ).toEqual([]);
  });
});
