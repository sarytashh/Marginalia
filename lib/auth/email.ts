const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (email.length === 0 || email.length > 254) {
    return false;
  }
  return EMAIL_PATTERN.test(email);
}

export function emailValidationMessage(value: string): string | null {
  const email = normalizeEmail(value);
  if (email.length === 0) {
    return "Enter the email you use for Marginalia.";
  }
  if (!isValidEmail(email)) {
    return "That does not look like an email address.";
  }
  return null;
}
