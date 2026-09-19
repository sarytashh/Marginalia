import { describe, expect, it } from "vitest";

import { LINK_ERROR_COPY, magicLinkSendError } from "@/lib/auth/messages";

describe("magicLinkSendError", () => {
  it("names the hourly email quota without exposing a status code", () => {
    expect(
      magicLinkSendError({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
        status: 429,
      }),
    ).toContain("about an hour");
  });

  it("names a short cooldown without exposing a status code", () => {
    expect(magicLinkSendError({ message: "too many requests", status: 429 })).toBe(
      "Too many sign-in emails. Wait a minute and try again.",
    );
  });

  it("keeps the typed address after a network failure", () => {
    expect(magicLinkSendError("Failed to fetch")).toContain("still here");
  });
});

describe("LINK_ERROR_COPY", () => {
  it("offers a new link after expiry", () => {
    expect(LINK_ERROR_COPY.expired).toContain("expired");
    expect(LINK_ERROR_COPY.invalid).toContain("not valid");
  });
});
