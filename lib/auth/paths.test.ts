import { describe, expect, it } from "vitest";

import { isApiPath, isPublicAuthPath } from "@/lib/auth/paths";

describe("isPublicAuthPath", () => {
  it("allows the sign-in page and auth callback", () => {
    expect(isPublicAuthPath("/sign-in")).toBe(true);
    expect(isPublicAuthPath("/auth/callback")).toBe(true);
  });

  it("does not treat app routes as public", () => {
    expect(isPublicAuthPath("/")).toBe(false);
    expect(isPublicAuthPath("/study")).toBe(false);
    expect(isPublicAuthPath("/progress")).toBe(false);
    expect(isPublicAuthPath("/documents/abc")).toBe(false);
    expect(isPublicAuthPath("/sign-in/extra")).toBe(false);
  });
});

describe("isApiPath", () => {
  it("matches API routes including nested handlers", () => {
    expect(isApiPath("/api")).toBe(true);
    expect(isApiPath("/api/documents")).toBe(true);
    expect(isApiPath("/study")).toBe(false);
  });
});
