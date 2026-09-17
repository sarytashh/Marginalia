import { describe, expect, it } from "vitest";

import { batchItems, EMBEDDING_BATCH_SIZE } from "@/lib/ai/batch";

describe("batchItems", () => {
  it("keeps a full batch of 32 in one request", () => {
    const items = Array.from({ length: EMBEDDING_BATCH_SIZE }, (_, index) => index);
    expect(batchItems(items)).toEqual([items]);
  });

  it("splits 33 items into a full batch and a remainder", () => {
    const items = Array.from({ length: 33 }, (_, index) => index);
    const batches = batchItems(items);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(32);
    expect(batches[1]).toEqual([32]);
  });

  it("returns no batches for an empty list", () => {
    expect(batchItems([])).toEqual([]);
  });
});
