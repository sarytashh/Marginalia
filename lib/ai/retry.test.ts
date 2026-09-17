import { afterEach, describe, expect, it, vi } from "vitest";

import { AiError } from "@/lib/ai/errors";
import { computeBackoffMs, withRetry } from "@/lib/ai/retry";

describe("computeBackoffMs", () => {
  it("doubles the base delay on each failed attempt and adds jitter", () => {
    expect(
      computeBackoffMs(1, { baseDelayMs: 100, jitterMs: 50, random: () => 0.5 }),
    ).toBe(125);
    expect(
      computeBackoffMs(2, { baseDelayMs: 100, jitterMs: 50, random: () => 0.5 }),
    ).toBe(225);
    expect(
      computeBackoffMs(3, { baseDelayMs: 100, jitterMs: 50, random: () => 0.5 }),
    ).toBe(425);
  });

  it("caps exponential delay at maxDelayMs before jitter", () => {
    expect(
      computeBackoffMs(8, {
        baseDelayMs: 1000,
        maxDelayMs: 1500,
        jitterMs: 0,
        random: () => 0,
      }),
    ).toBe(1500);
  });
});

describe("withRetry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the first successful result without sleeping", async () => {
    const sleep = vi.fn(async () => undefined);
    const operation = vi.fn().mockResolvedValue("ok");

    await expect(withRetry(operation, { sleep })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries 429 and 5xx, then returns the successful result", async () => {
    const sleep = vi.fn(async () => undefined);
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new AiError("busy", { retryable: true, status: 429 }))
      .mockRejectedValueOnce(new AiError("down", { retryable: true, status: 503 }))
      .mockResolvedValueOnce("ok");

    await expect(
      withRetry(operation, { sleep, maxAttempts: 4, random: () => 0 }),
    ).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 400 error", async () => {
    const sleep = vi.fn(async () => undefined);
    const operation = vi.fn().mockRejectedValue({ status: 400, message: "bad" });

    await expect(withRetry(operation, { sleep })).rejects.toBeInstanceOf(AiError);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("throws AiError after the last retryable failure", async () => {
    const sleep = vi.fn(async () => undefined);
    const operation = vi.fn().mockRejectedValue({ status: 429 });

    await expect(
      withRetry(operation, { sleep, maxAttempts: 3, random: () => 0 }),
    ).rejects.toBeInstanceOf(AiError);
    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});
