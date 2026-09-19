const EMAIL_OTP_TYPES = new Set([
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
]);

export type EmailOtpType =
  | "email"
  | "magiclink"
  | "signup"
  | "invite"
  | "recovery"
  | "email_change";

export function parseOtpType(value: string | null): EmailOtpType | null {
  if (value === null || !EMAIL_OTP_TYPES.has(value)) {
    return null;
  }
  return value as EmailOtpType;
}
