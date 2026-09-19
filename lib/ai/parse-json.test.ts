import { describe, expect, it } from "vitest";

import { parseModelJson } from "@/lib/ai/parse-json";

describe("parseModelJson", () => {
  it("parses a plain object", () => {
    expect(parseModelJson('{"topics":[]}')).toEqual({ topics: [] });
  });

  it("strips a markdown fence", () => {
    expect(parseModelJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("extracts the first JSON object from surrounding prose", () => {
    expect(parseModelJson('Here you go:\n{"name":"Graphs"}\nThanks.')).toEqual({
      name: "Graphs",
    });
  });
});
