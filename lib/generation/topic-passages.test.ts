import { describe, expect, it } from "vitest";

import { selectTopicPassages } from "@/lib/generation/topic-passages";

const passage = (id: string, similarity: number) => ({ id, similarity });

describe("selectTopicPassages", () => {
  it("drops passages far below the best match", () => {
    const selected = selectTopicPassages([
      passage("gradient", 0.82),
      passage("learning-rate", 0.78),
      passage("mse", 0.61),
      passage("ridge", 0.55),
    ]);
    expect(selected.map((item) => item.id)).toEqual(["gradient", "learning-rate"]);
  });

  it("always keeps the minimum number of passages", () => {
    const selected = selectTopicPassages([
      passage("best", 0.9),
      passage("weak", 0.4),
      passage("weaker", 0.3),
    ]);
    expect(selected.map((item) => item.id)).toEqual(["best", "weak"]);
  });

  it("orders by similarity and handles empty input", () => {
    expect(selectTopicPassages([])).toEqual([]);
    const selected = selectTopicPassages([passage("b", 0.7), passage("a", 0.75)]);
    expect(selected.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
