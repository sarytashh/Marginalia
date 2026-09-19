import { describe, expect, it } from "vitest";

import { parseOtpType } from "@/lib/auth/otp";

describe("parseOtpType", () => {
  it("accepts the email confirmation types Supabase puts on links", () => {
    expect(parseOtpType("email")).toBe("email");
    expect(parseOtpType("signup")).toBe("signup");
    expect(parseOtpType("magiclink")).toBe("magiclink");
  });

  it("rejects unknown types so a bad link is not verified as email", () => {
    expect(parseOtpType("password")).toBeNull();
    expect(parseOtpType("")).toBeNull();
  });
});
