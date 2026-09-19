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
