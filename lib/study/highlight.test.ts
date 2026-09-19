import { describe, expect, it } from "vitest";

import { highlightSupportingSentence, splitSentences } from "@/lib/study/highlight";

describe("splitSentences", () => {
  it("keeps page-like sentences and Chinese stop marks", () => {
    expect(
      splitSentences("Keep a frontier. Pop the closest vertex. 下一步。"),
    ).toEqual(["Keep a frontier.", "Pop the closest vertex.", "下一步。"]);
  });
});

describe("highlightSupportingSentence", () => {
  const excerpt =
    "Dijkstra grows a shortest-path tree from the source. The frontier is a priority queue of tentative distances. Negative edge weights are not allowed.";

  it("picks the sentence that overlaps the explanation", () => {
    expect(
      highlightSupportingSentence(
        excerpt,
        "The algorithm stores the frontier in a priority queue of tentative distances.",
      ),
    ).toBe("The frontier is a priority queue of tentative distances.");
  });

  it("falls back to the first sentence when nothing overlaps", () => {
    expect(highlightSupportingSentence(excerpt, "zzz")).toBe(
      "Dijkstra grows a shortest-path tree from the source.",
    );
  });

  it("returns null for an empty excerpt", () => {
    expect(highlightSupportingSentence("   ", "priority queue")).toBeNull();
  });
});
