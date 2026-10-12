import { describe, expect, it } from "vitest";

import { countWords } from "@/lib/generation/word-count";

describe("countWords", () => {
  it("counts words and numbers across chunks", () => {
    expect(countWords([{ content: "Gradient descent, step 2." }, { content: "x^2 + 1" }])).toBe(7);
  });

  it("counts Chinese runs and ignores symbols", () => {
    expect(countWords([{ content: "梯度下降 — ∑ →" }])).toBe(1);
    expect(countWords([])).toBe(0);
  });
});
