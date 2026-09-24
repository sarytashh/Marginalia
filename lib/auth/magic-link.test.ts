import { describe, expect, it } from "vitest";

import { magicLinkRedirectTo } from "@/lib/auth/magic-link";

describe("magicLinkRedirectTo", () => {
  it("is the callback path with no query, so Supabase allow lists can match it", () => {
    expect(magicLinkRedirectTo("http://localhost:4317")).toBe(
      "http://localhost:4317/auth/callback",
    );
    expect(magicLinkRedirectTo("https://gleeful-mooncake-0293b9.netlify.app")).toBe(
      "https://gleeful-mooncake-0293b9.netlify.app/auth/callback",
    );
  });
});
