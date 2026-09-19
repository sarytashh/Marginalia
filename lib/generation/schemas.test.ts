import { describe, expect, it } from "vitest";

import {
  questionGenerationSchema,
  topicExtractionSchema,
} from "@/lib/generation/schemas";

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

describe("questionGenerationSchema", () => {
  it("keeps qwen2.5 object-map multiple choice by matching the reference answer", () => {
    const parsed = questionGenerationSchema.parse({
      questions: [
        {
          kind: "short_answer",
          prompt: "What are the basic components of a graph?",
          referenceAnswer: "A graph consists of a set of vertices connected by edges.",
          options: null,
          difficulty: 1,
          sourceChunkIds: ["CHUNK_01"],
        },
        {
          kind: "multiple_choice",
          prompt: "Which algorithm can handle negative edge weights in a graph?",
          options: {
            A: "Dijkstra's algorithm",
            B: "Bellman-Ford algorithm",
            C: "Kruskal's algorithm",
            D: "Prim's algorithm",
          },
          referenceAnswer: "Bellman-Ford algorithm can handle negative edge weights.",
          difficulty: 3,
          sourceChunkIds: ["CHUNK_02", "CHUNK_03"],
        },
      ],
    });

    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[1]?.kind).toBe("multiple_choice");
    expect(parsed.questions[1]?.options).toEqual([
      { id: "A", text: "Dijkstra's algorithm", correct: false },
      { id: "B", text: "Bellman-Ford algorithm", correct: true },
      { id: "C", text: "Kruskal's algorithm", correct: false },
      { id: "D", text: "Prim's algorithm", correct: false },
    ]);
  });

  it("keeps valid questions when one item in the batch is malformed", () => {
    const parsed = questionGenerationSchema.parse({
      questions: [
        {
          kind: "short_answer",
          prompt: "When does Dijkstra work?",
          referenceAnswer: "When every edge weight is non-negative.",
          difficulty: 2,
          sourceChunkIds: ["CHUNK_01"],
        },
        { kind: "short_answer", prompt: "Missing everything else" },
      ],
    });

    expect(parsed.questions).toHaveLength(1);
    expect(parsed.questions[0]?.prompt).toBe("When does Dijkstra work?");
  });
});


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
