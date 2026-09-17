import { describe, expect, it, vi } from "vitest";

import { embedTexts } from "@/lib/ai/embed";
import { AiError } from "@/lib/ai/errors";

describe("embedTexts", () => {
  it("returns an empty array without calling the network", async () => {
    const embedBatch = vi.fn();
    await expect(embedTexts([], { embedBatch, dimensions: 2 })).resolves.toEqual([]);
    expect(embedBatch).not.toHaveBeenCalled();
  });

  it("batches more than 32 inputs and preserves order", async () => {
    const texts = Array.from({ length: 40 }, (_, index) => `t${index}`);
    const embedBatch = vi.fn(async (input: string[]) =>
      input.map((text) => [Number(text.slice(1)), 0]),
    );

    const vectors = await embedTexts(texts, { embedBatch, dimensions: 2 });

    expect(embedBatch).toHaveBeenCalledTimes(2);
    expect(embedBatch.mock.calls[0]?.[0]).toHaveLength(32);
    expect(embedBatch.mock.calls[1]?.[0]).toHaveLength(8);
    expect(vectors).toHaveLength(40);
    expect(vectors[0]).toEqual([0, 0]);
    expect(vectors[39]).toEqual([39, 0]);
  });

  it("retries a 429 from a batch, then succeeds", async () => {
    const embedBatch = vi
      .fn()
      .mockRejectedValueOnce(new AiError("busy", { retryable: true, status: 429 }))
      .mockResolvedValueOnce([[1, 2]]);

    await expect(
      embedTexts(["only"], {
        embedBatch,
        dimensions: 2,
        retry: { sleep: async () => undefined, random: () => 0 },
      }),
    ).resolves.toEqual([[1, 2]]);
    expect(embedBatch).toHaveBeenCalledTimes(2);
  });
});
