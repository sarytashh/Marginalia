import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { completeStructured } from "@/lib/ai/complete-structured";
import { AiError } from "@/lib/ai/errors";

const topicSchema = z.object({
  name: z.string(),
  summary: z.string(),
});

describe("completeStructured", () => {
  it("returns parsed data when the first response matches the schema", async () => {
    const completeJson = vi.fn().mockResolvedValue(
      JSON.stringify({ name: "Graphs", summary: "Nodes and edges." }),
    );

    await expect(
      completeStructured({
        schema: topicSchema,
        system: "Extract a topic.",
        user: "Graph theory lecture",
        completeJson,
      }),
    ).resolves.toEqual({ name: "Graphs", summary: "Nodes and edges." });
    expect(completeJson).toHaveBeenCalledTimes(1);
  });

  it("retries once with the validation error when JSON does not match", async () => {
    const completeJson = vi
      .fn()
      .mockResolvedValueOnce("{")
      .mockResolvedValueOnce(
        JSON.stringify({ name: "Graphs", summary: "Nodes and edges." }),
      );

    const result = await completeStructured({
      schema: topicSchema,
      system: "Extract a topic.",
      user: "Graph theory lecture",
      completeJson,
    });

    expect(result.name).toBe("Graphs");
    expect(completeJson).toHaveBeenCalledTimes(2);
    const retryUser = completeJson.mock.calls[1]?.[0]?.user as string;
    expect(retryUser).toContain("Graph theory lecture");
    expect(retryUser).toContain("not valid");
  });

  it("throws AiError when the retry still fails the schema", async () => {
    const completeJson = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ name: 1 }))
      .mockResolvedValueOnce(JSON.stringify({ name: 2 }));

    await expect(
      completeStructured({
        schema: topicSchema,
        system: "Extract a topic.",
        user: "Graph theory lecture",
        completeJson,
      }),
    ).rejects.toBeInstanceOf(AiError);
    expect(completeJson).toHaveBeenCalledTimes(2);
  });
});
