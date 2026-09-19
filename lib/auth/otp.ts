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

const VERIFY_ORDER: EmailOtpType[] = [
  "signup",
  "magiclink",
  "email",
  "invite",
  "recovery",
  "email_change",
];

export function otpTypesToTry(requested: string | null): EmailOtpType[] {
  const parsed = parseOtpType(requested);
  if (parsed === null) {
    return [...VERIFY_ORDER];
  }
  return [parsed, ...VERIFY_ORDER.filter((type) => type !== parsed)];
}
