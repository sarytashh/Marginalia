export function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current !== undefined && current !== null && !seen.has(current)) {
    seen.add(current);
    if (typeof current === "string") {
      parts.push(current);
      break;
    }
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
      continue;
    }
    if (typeof current === "object" && "message" in current) {
      const message = current.message;
      if (typeof message === "string" && message !== "") {
        parts.push(message);
      }
    }
    if (typeof current === "object" && "cause" in current) {
      current = current.cause;
      continue;
    }
    break;
  }

  return parts.join(" ").toLowerCase();
}

export function isRetryableNetworkError(error: unknown): boolean {
  const text = collectErrorText(error);
  return (
    text.includes("connection") ||
    text.includes("fetch failed") ||
    text.includes("econnrefused") ||
    text.includes("econnreset") ||
    text.includes("etimedout") ||
    text.includes("enotfound") ||
    text.includes("socket") ||
    text.includes("aborted") ||
    text.includes("timeout") ||
    text.includes("terminated")
  );
}
