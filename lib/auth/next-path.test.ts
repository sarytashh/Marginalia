import { describe, expect, it } from "vitest";

import { safeNextPath, signInHref } from "@/lib/auth/next-path";

describe("safeNextPath", () => {
  it("keeps in-app paths and query strings", () => {
    expect(safeNextPath("/study?document=abc")).toBe("/study?document=abc");
    expect(safeNextPath("/progress")).toBe("/progress");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("not-a-path")).toBe("/");
  });
});

describe("signInHref", () => {
  it("omits next when the destination is the library", () => {
    expect(signInHref("/")).toBe("/sign-in");
  });

  it("encodes a nested return path", () => {
    expect(signInHref("/study?document=abc")).toBe(
      "/sign-in?next=%2Fstudy%3Fdocument%3Dabc",
    );
  });
});
