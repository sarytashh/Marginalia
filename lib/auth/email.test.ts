import { describe, expect, it } from "vitest";

import { emailValidationMessage, isValidEmail, normalizeEmail } from "@/lib/auth/email";

describe("normalizeEmail", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  student@university.edu  ")).toBe("student@university.edu");
  });
});

describe("isValidEmail", () => {
  it("accepts a typical address", () => {
    expect(isValidEmail("student@university.edu")).toBe(true);
  });

  it("rejects empty and malformed values", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
    expect(isValidEmail("@no-local.com")).toBe(false);
  });
});

describe("emailValidationMessage", () => {
  it("asks for an email only after the field is empty", () => {
    expect(emailValidationMessage("")).toBe("Enter the email you use for Marginalia.");
    expect(emailValidationMessage("   ")).toBe("Enter the email you use for Marginalia.");
  });

  it("names an invalid address without a generic form error", () => {
    expect(emailValidationMessage("hello")).toBe("That does not look like an email address.");
  });

  it("returns null for a usable address", () => {
    expect(emailValidationMessage("uluc@example.com")).toBeNull();
  });
});
