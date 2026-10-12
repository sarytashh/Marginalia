import { describe, expect, it } from "vitest";

import {
  isDuplicateQuestionPrompt,
  questionPromptKey,
  topicNameKey,
} from "@/lib/generation/dedupe";

describe("questionPromptKey", () => {
  it("ignores punctuation, case, and extra spaces", () => {
    expect(questionPromptKey("  What is Dijkstra's algorithm?  ")).toBe(
      questionPromptKey("what is dijkstra s algorithm"),
    );
  });
});

describe("isDuplicateQuestionPrompt", () => {
  it("treats the same prompt with different punctuation as a duplicate", () => {
    const existing = new Set([questionPromptKey("What is a shortest path?")]);
    expect(isDuplicateQuestionPrompt("What is a shortest path?", existing)).toBe(
      true,
    );
  });

  it("treats a longer restatement that contains an existing prompt as a duplicate", () => {
    const existing = new Set([
      questionPromptKey("When does Dijkstra find shortest paths"),
    ]);
    expect(
      isDuplicateQuestionPrompt(
        "When does Dijkstra find shortest paths in a graph?",
        existing,
      ),
    ).toBe(true);
  });

  it("keeps a prompt that asks about a different idea", () => {
    const existing = new Set([
      questionPromptKey("When does Dijkstra find shortest paths?"),
    ]);
    expect(
      isDuplicateQuestionPrompt(
        "How does Bellman-Ford handle a negative-weight cycle?",
        existing,
      ),
    ).toBe(false);
  });
});

describe("topicNameKey", () => {
  it("collapses spacing so duplicate topic names match", () => {
    expect(topicNameKey("  Shortest   paths  ")).toBe("shortest paths");
  });
});

describe("isDuplicateQuestionPrompt with reworded prompts", () => {
  const isDuplicate = (candidate: string, previous: string) =>
    isDuplicateQuestionPrompt(candidate, new Set([questionPromptKey(previous)]));

  it("catches a rewording that shares most content words", () => {
    expect(
      isDuplicate(
        "What is the purpose of the loss function in the context of linear regression?",
        "What does the loss function measure in the context of linear regression?",
      ),
    ).toBe(true);
    expect(
      isDuplicate(
        "What is the effect of squaring the error in the mean squared error (MSE) loss function?",
        "What is the effect of squaring the error in the mean squared error loss function?",
      ),
    ).toBe(true);
    expect(
      isDuplicate(
        "Factorize the polynomial p(x) = 2x^2 - 3x - 1.",
        "Factorize the polynomial 2x^2 - 3x - 1.",
      ),
    ).toBe(true);
  });

  it("keeps drill questions that differ in their numbers", () => {
    expect(
      isDuplicate(
        "Factorize the expression x^2 + 8x + 16.",
        "Factorize the expression x^2 - 7x + 12.",
      ),
    ).toBe(false);
  });

  it("keeps different questions about the same concept", () => {
    expect(
      isDuplicate(
        "What happens to training when the learning rate is too large?",
        "What does the learning rate control in gradient descent?",
      ),
    ).toBe(false);
  });
});
