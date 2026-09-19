import { describe, expect, it } from "vitest";

import {
  excerptPassage,
  formatEditorialIndex,
  formatQuestionKind,
  formatSourcePages,
} from "@/lib/documents/format";

describe("formatEditorialIndex", () => {
  it("zero-pads one-based numbers", () => {
    expect(formatEditorialIndex(0)).toBe("01");
    expect(formatEditorialIndex(11)).toBe("12");
  });
});

describe("formatQuestionKind", () => {
  it("uses sentence-case labels", () => {
    expect(formatQuestionKind("short_answer")).toBe("Short answer");
    expect(formatQuestionKind("multiple_choice")).toBe("Multiple choice");
  });
});

describe("formatSourcePages", () => {
  it("names a single page and lists several", () => {
    expect(formatSourcePages([])).toBe("Source page unavailable");
    expect(formatSourcePages([14])).toBe("Page 14");
    expect(formatSourcePages([15, 14])).toBe("Pages 14 and 15");
    expect(formatSourcePages([18, 12, 14])).toBe("Pages 12, 14, and 18");
  });
});

describe("excerptPassage", () => {
  it("keeps short passages intact", () => {
    expect(excerptPassage("Dijkstra uses a priority queue.")).toBe(
      "Dijkstra uses a priority queue.",
    );
  });
});
