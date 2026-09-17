import { AiError, getErrorStatus, isRetryableStatus, toAiError } from "@/lib/ai/errors";

export type RetryOptions = {
  baseDelayMs?: number;
  jitterMs?: number;
  maxAttempts?: number;
  maxDelayMs?: number;
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULT_BASE_DELAY_MS = 400;
const DEFAULT_JITTER_MS = 200;
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_MAX_DELAY_MS = 8000;

export function computeBackoffMs(
  failedAttempt: number,
  options: Pick<RetryOptions, "baseDelayMs" | "jitterMs" | "maxDelayMs" | "random"> = {},
): number {
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const jitterMs = options.jitterMs ?? DEFAULT_JITTER_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const random = options.random ?? Math.random;
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (failedAttempt - 1));
  return exponential + random() * jitterMs;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = getErrorStatus(error);
      const retryable =
        error instanceof AiError
          ? error.retryable
          : status !== undefined && isRetryableStatus(status);

      if (!retryable || attempt === maxAttempts) {
        throw toAiError(error);
      }

      await sleep(computeBackoffMs(attempt, options));
    }
  }

  throw toAiError(lastError);
}
