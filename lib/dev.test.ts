import { describe, expect, it } from "vitest";

import { isDebugPath } from "@/lib/dev";

describe("isDebugPath", () => {
  it("matches the retrieval debug page and API", () => {
    expect(isDebugPath("/debug")).toBe(true);
    expect(isDebugPath("/debug/search")).toBe(true);
    expect(isDebugPath("/api/debug")).toBe(true);
    expect(isDebugPath("/api/debug/search")).toBe(true);
  });

  it("does not match app routes", () => {
    expect(isDebugPath("/")).toBe(false);
    expect(isDebugPath("/study")).toBe(false);
    expect(isDebugPath("/documents/debug")).toBe(false);
    expect(isDebugPath("/api/documents")).toBe(false);
  });
});
