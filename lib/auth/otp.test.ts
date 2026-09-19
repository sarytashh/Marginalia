import { describe, expect, it } from "vitest";

import { otpTypesToTry, parseOtpType } from "@/lib/auth/otp";

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

describe("otpTypesToTry", () => {
  it("tries signup and magiclink when the template omitted a type", () => {
    expect(otpTypesToTry(null)[0]).toBe("signup");
    expect(otpTypesToTry(null)).toContain("magiclink");
    expect(otpTypesToTry(null)).toContain("email");
  });

  it("tries the requested type first", () => {
    expect(otpTypesToTry("email")[0]).toBe("email");
    expect(otpTypesToTry("email")).toContain("signup");
  });
});
