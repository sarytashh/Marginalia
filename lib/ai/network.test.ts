import { describe, expect, it } from "vitest";

import { toAiError } from "@/lib/ai/errors";
import { isRetryableNetworkError } from "@/lib/ai/network";

describe("isRetryableNetworkError", () => {
  it("treats Ollama connection failures as retryable", () => {
    const error = new Error("Connection error.");
    error.cause = new TypeError("fetch failed");
    expect(isRetryableNetworkError(error)).toBe(true);
    expect(toAiError(error).retryable).toBe(true);
  });

  it("does not treat a 400-style payload as a network failure", () => {
    expect(isRetryableNetworkError({ status: 400, message: "bad request" })).toBe(
      false,
    );
  });
});
