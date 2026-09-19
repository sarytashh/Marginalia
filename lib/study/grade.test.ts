import { describe, expect, it } from "vitest";

import { gradeModelSchema, gradeMultipleChoice, verdictFromScore } from "@/lib/study/grade";

const options = [
  { id: "A", text: "Relax the edge", correct: false },
  { id: "B", text: "A priority queue of tentative distances", correct: true },
  { id: "C", text: "Depth-first search", correct: false },
  { id: "D", text: "A FIFO queue of vertices", correct: false },
] as const;

describe("verdictFromScore", () => {
  it("uses the 0.8 and 0.5 boundaries", () => {
    expect(verdictFromScore(1)).toBe("correct");
    expect(verdictFromScore(0.8)).toBe("correct");
    expect(verdictFromScore(0.79)).toBe("partial");
    expect(verdictFromScore(0.5)).toBe("partial");
    expect(verdictFromScore(0.49)).toBe("incorrect");
    expect(verdictFromScore(0)).toBe("incorrect");
  });
});

describe("gradeModelSchema", () => {
  it("accepts camelCase fields and derives verdict from score", () => {
    const parsed = gradeModelSchema.parse({
      explanation: "The passage defines the frontier with a priority queue.",
      whatYouGotRight: ["You named the priority queue."],
      whatYouMissed: [],
      score: 0.9,
      verdict: "incorrect",
    });
    expect(parsed.verdict).toBe("correct");
    expect(parsed.score).toBe(0.9);
  });

  it("accepts snake_case aliases and 0-100 scores", () => {
    const parsed = gradeModelSchema.parse({
      explanation: "The core idea is missing.",
      what_you_got_right: [],
      what_you_missed: ["The frontier is ordered by tentative distance."],
      score: 40,
      verdict: "partial",
    });
    expect(parsed.score).toBe(0.4);
    expect(parsed.verdict).toBe("incorrect");
    expect(parsed.whatYouMissed).toEqual([
      "The frontier is ordered by tentative distance.",
    ]);
  });
});

describe("gradeMultipleChoice", () => {
  const reference =
    "Dijkstra keeps a priority queue of tentative distances so the next vertex is always the closest unsettled one.";

  it("scores a correct option locally without a model", () => {
    expect(
      gradeMultipleChoice({
        options,
        referenceAnswer: reference,
        userAnswer: "B",
      }),
    ).toMatchObject({
      score: 1,
      verdict: "correct",
      correctChoiceId: "B",
      explanation: reference,
    });
  });

  it("scores a wrong option as incorrect and names the source-backed choice", () => {
    const result = gradeMultipleChoice({
      options,
      referenceAnswer: reference,
      userAnswer: "A. Relax the edge",
    });
    expect(result.score).toBe(0);
    expect(result.verdict).toBe("incorrect");
    expect(result.whatYouMissed[0]).toContain("B.");
    expect(result.correctChoiceId).toBe("B");
  });
});
