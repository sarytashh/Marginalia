import { isRetryableNetworkError } from "@/lib/ai/network";

export class AiError extends Error {
  readonly retryable: boolean;
  readonly status: number | undefined;

  constructor(
    message: string,
    options: { cause?: unknown; retryable?: boolean; status?: number } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AiError";
    this.retryable = options.retryable ?? false;
    this.status = options.status;
  }
}

export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof AiError) {
    return error.status;
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    const status = error.status;
    if (typeof status === "number") {
      return status;
    }
  }

  return undefined;
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) {
    return error;
  }

  const status = getErrorStatus(error);

  if (status === 429) {
    return new AiError("The study model is busy. Try again in a moment.", {
      cause: error,
      retryable: true,
      status,
    });
  }

  if (status !== undefined && isRetryableStatus(status)) {
    return new AiError("The study model is unavailable right now. Try again in a moment.", {
      cause: error,
      retryable: true,
      status,
    });
  }

  if (status === 401 || status === 403) {
    return new AiError("The study model rejected the request. Check the matching AI_*_API_KEY in .env.local.", {
      cause: error,
      retryable: false,
      status,
    });
  }

  if (isRetryableNetworkError(error)) {
    return new AiError("Marginalia could not reach the study model. Try again.", {
      cause: error,
      retryable: true,
      status,
    });
  }

  return new AiError("Marginalia could not reach the study model. Try again.", {
    cause: error,
    retryable: false,
    status,
  });
}
