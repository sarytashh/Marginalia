import { describe, expect, it } from "vitest";

import { isActiveRoute, navItems } from "@/lib/navigation";

describe("isActiveRoute", () => {
  it("matches the library route only on an exact path", () => {
    expect(isActiveRoute("/", "/")).toBe(true);
    expect(isActiveRoute("/study", "/")).toBe(false);
    expect(isActiveRoute("/documents/abc", "/")).toBe(false);
  });

  it("matches a section and its nested paths", () => {
    expect(isActiveRoute("/study", "/study")).toBe(true);
    expect(isActiveRoute("/study/session-1", "/study")).toBe(true);
  });

  it("does not match a route that merely shares a prefix", () => {
    expect(isActiveRoute("/studying", "/study")).toBe(false);
  });
});

describe("navItems", () => {
  it("exposes the three top-level destinations", () => {
    expect(navItems.map((item) => item.href)).toEqual([
      "/",
      "/study",
      "/progress",
    ]);
  });
});
