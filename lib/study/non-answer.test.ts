import { describe, expect, it } from "vitest";

import { isNonAnswer } from "@/lib/study/non-answer";

describe("isNonAnswer", () => {
  it("treats shrugs and I-don't-know as no credit", () => {
    expect(isNonAnswer("i have no idea")).toBe(true);
    expect(isNonAnswer("I have no idea.")).toBe(true);
    expect(isNonAnswer("i have no idea about this question")).toBe(true);
    expect(isNonAnswer("I don't know")).toBe(true);
    expect(isNonAnswer("idk")).toBe(true);
    expect(isNonAnswer("no clue")).toBe(true);
    expect(isNonAnswer("不知道")).toBe(true);
    expect(isNonAnswer("???")).toBe(true);
  });

  it("does not treat a real attempt as a shrug", () => {
    expect(isNonAnswer("Every edge weight has to be non-negative.")).toBe(false);
    expect(
      isNonAnswer("I have no idea, but the weights must be non-negative."),
    ).toBe(false);
  });
});
