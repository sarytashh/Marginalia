export function magicLinkSendError(error: { message: string; status?: number } | string): string {
  const message = typeof error === "string" ? error : error.message;
  const status = typeof error === "string" ? undefined : error.status;

  if (status === 429 || /rate|too many/i.test(message)) {
    return "Too many sign-in emails. Wait a minute and try again.";
  }
  if (/invalid.*email|unable to validate/i.test(message)) {
    return "That does not look like an email address.";
  }
  if (/network|fetch|failed to fetch/i.test(message)) {
    return "Marginalia could not send that email. Your address is still here — try again.";
  }
  return "Marginalia could not send that email. Your address is still here — try again.";
}

export const LINK_ERROR_COPY = {
  expired: "That sign-in link has expired. Enter your email for a new one.",
  invalid: "That sign-in link is not valid. Enter your email for a new one.",
} as const;
