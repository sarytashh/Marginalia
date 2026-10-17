import { describe, expect, it } from "vitest";

import {
  duplicateReviewSchema,
  formatQuestionList,
  selectDuplicatesToRemove,
  type ReviewedQuestion,
} from "@/lib/generation/duplicate-review";

const question = (id: string, topicId: string, isNew = true): ReviewedQuestion => ({
  id,
  isNew,
  prompt: `Prompt ${id}`,
  topicId,
});

const list = [
  question("a", "t1"),
  question("b", "t1"),
  question("c", "t2"),
  question("d", "t2"),
  question("e", "t3"),
];

describe("formatQuestionList", () => {
  it("numbers questions from 1", () => {
    expect(formatQuestionList(list.slice(0, 2))).toBe("1. Prompt a\n2. Prompt b");
  });
});

describe("duplicateReviewSchema", () => {
  it("accepts numbers given as strings and a missing list", () => {
    expect(duplicateReviewSchema.parse({ duplicates: [{ number: "2", duplicateOf: "1" }] })).toEqual({
      duplicates: [{ number: 2, duplicateOf: 1 }],
    });
    expect(duplicateReviewSchema.parse({})).toEqual({ duplicates: [] });
  });
});

describe("selectDuplicatesToRemove", () => {
  it("removes a later question that repeats an earlier one", () => {
    expect(selectDuplicatesToRemove(list, [{ number: 2, duplicateOf: 1 }])).toEqual(["b"]);
  });

  it("ignores invalid, backwards and out-of-range verdicts", () => {
    expect(
      selectDuplicatesToRemove(list, [
        { number: 1, duplicateOf: 2 },
        { number: 3, duplicateOf: 3 },
        { number: 9, duplicateOf: 1 },
      ]),
    ).toEqual([]);
  });

  it("never removes the last question of a topic", () => {
    expect(selectDuplicatesToRemove(list, [{ number: 5, duplicateOf: 1 }])).toEqual([]);
  });

  it("keeps questions a student may already have practised", () => {
    const withOld = [question("old", "t1", false), ...list];
    expect(selectDuplicatesToRemove(withOld, [{ number: 1, duplicateOf: 2 }])).toEqual([]);
    expect(selectDuplicatesToRemove(withOld, [{ number: 2, duplicateOf: 1 }])).toEqual(["a"]);
  });

  it("does not chain removals through a question that was itself removed", () => {
    expect(
      selectDuplicatesToRemove(list, [
        { number: 2, duplicateOf: 1 },
        { number: 4, duplicateOf: 2 },
      ]),
    ).toEqual(["b"]);
  });

  it("stops at the removal budget when the model over-reports", () => {
    const many = Array.from({ length: 10 }, (_, index) => question(`q${index}`, `t${index % 2}`));
    const verdicts = Array.from({ length: 9 }, (_, index) => ({ number: index + 2, duplicateOf: 1 }));
    expect(selectDuplicatesToRemove(many, verdicts)).toHaveLength(4);
  });
});
