import { describe, expect, it } from "vitest";

import { AiError } from "@/lib/ai/errors";
import {
  describeProviderCheckFailure,
  failedProviderCheck,
  formatProviderCheckReport,
  okProviderCheck,
  providerCheckExitCode,
} from "@/lib/ai/check";

describe("provider check report", () => {
  it("prints both sides when embeddings fail and chat succeeds", () => {
    const results = [
      okProviderCheck("chat", "ok"),
      failedProviderCheck(
        "embeddings",
        new AiError("The study model could not be reached.", { status: 404 }),
      ),
    ];

    expect(formatProviderCheckReport(results)).toBe(
      [
        "Chat: ok",
        "Embeddings: failed — The study model could not be reached. HTTP 404 — this host has no embeddings API. Point AI_EMBEDDING_BASE_URL at local Ollama bge-m3 (http://127.0.0.1:11434/v1).",
      ].join("\n"),
    );
    expect(providerCheckExitCode(results)).toBe(1);
  });

  it("returns 0 only when both sides succeed", () => {
    const results = [
      okProviderCheck("chat", "ok"),
      okProviderCheck("embeddings", "ok (1024 dimensions)"),
    ];

    expect(formatProviderCheckReport(results)).toBe(
      ["Chat: ok", "Embeddings: ok (1024 dimensions)"].join("\n"),
    );
    expect(providerCheckExitCode(results)).toBe(0);
  });

  it("explains a chat 404 without mentioning embeddings", () => {
    expect(
      describeProviderCheckFailure("chat", new AiError("Not found", { status: 404 })),
    ).toContain("AI_CHAT_BASE_URL");
  });
});
