import { describe, expect, it } from "vitest";

import { extractJsonStringField } from "@/lib/ai/extract-json-field";

describe("extractJsonStringField", () => {
  it("reads a complete explanation from partial JSON", () => {
    const text = `{"explanation": "Dijkstra finds the shortest path.", "score":`;
    expect(extractJsonStringField(text, ["explanation"])).toBe(
      "Dijkstra finds the shortest path.",
    );
  });

  it("returns the in-progress string before the closing quote", () => {
    const text = `{"explanation": "Negative edge weights`;
    expect(extractJsonStringField(text, ["explanation"])).toBe(
      "Negative edge weights",
    );
  });

  it("unescapes quotes and newlines", () => {
    const text = `{"explanation": "Use \\"relaxation\\"\\nnext."}`;
    expect(extractJsonStringField(text, ["explanation"])).toBe(
      'Use "relaxation"\nnext.',
    );
  });

  it("prefers the first matching field name", () => {
    const text = `{"feedback": "From the passage.", "explanation": "Ignored."}`;
    expect(extractJsonStringField(text, ["explanation", "feedback"])).toBe(
      "Ignored.",
    );
    expect(extractJsonStringField(text, ["missing", "feedback"])).toBe(
      "From the passage.",
    );
  });
});
