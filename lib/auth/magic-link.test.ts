import { describe, expect, it } from "vitest";

import { magicLinkRedirectTo } from "@/lib/auth/magic-link";

describe("magicLinkRedirectTo", () => {
  it("always includes next so email templates can append token_hash", () => {
    expect(magicLinkRedirectTo("http://localhost:4317", "/")).toBe(
      "http://localhost:4317/auth/callback?next=%2F",
    );
    expect(magicLinkRedirectTo("https://marginalia.example", "/study")).toBe(
      "https://marginalia.example/auth/callback?next=%2Fstudy",
    );
  });
});
