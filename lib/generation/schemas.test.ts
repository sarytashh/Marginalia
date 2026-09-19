import { describe, expect, it } from "vitest";

import { topicExtractionSchema } from "@/lib/generation/schemas";

describe("topicExtractionSchema", () => {
  it("accepts name/summary objects", () => {
    const parsed = topicExtractionSchema.parse({
      topics: [{ name: "Dijkstra", summary: "Shortest paths with a queue." }],
    });
    expect(parsed.topics[0]?.name).toBe("Dijkstra");
  });

  it("accepts title/description aliases and a top-level array", () => {
    const parsed = topicExtractionSchema.parse([
      { title: "Bellman-Ford", description: "Handles negative weights." },
    ]);
    expect(parsed.topics).toEqual([
      { name: "Bellman-Ford", summary: "Handles negative weights." },
    ]);
  });
});
