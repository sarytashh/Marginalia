import { AiError, getErrorStatus } from "@/lib/ai/errors";

export type ProviderCheckName = "chat" | "embeddings";

export type ProviderCheckResult = {
  detail: string;
  name: ProviderCheckName;
  ok: boolean;
};

export function formatProviderCheckReport(results: readonly ProviderCheckResult[]): string {
  return results
    .map((result) => {
      const label = result.name === "chat" ? "Chat" : "Embeddings";
      return result.ok ? `${label}: ${result.detail}` : `${label}: failed — ${result.detail}`;
    })
    .join("\n");
}

export function providerCheckExitCode(results: readonly ProviderCheckResult[]): number {
  return results.every((result) => result.ok) ? 0 : 1;
}

export function describeProviderCheckFailure(
  name: ProviderCheckName,
  error: unknown,
): string {
  const status = getErrorStatus(error);
  const message = error instanceof Error ? error.message : "Request failed.";

  if (name === "embeddings" && status === 404) {
    return `${message} HTTP 404 — this host has no embeddings API. Point AI_EMBEDDING_BASE_URL at local Ollama bge-m3 (http://127.0.0.1:11434/v1).`;
  }

  if (name === "chat" && status === 404) {
    return `${message} HTTP 404 — check AI_CHAT_BASE_URL and AI_CHAT_MODEL.`;
  }

  if (status !== undefined) {
    return `${message} HTTP ${status}`;
  }

  return message;
}

export function failedProviderCheck(
  name: ProviderCheckName,
  error: unknown,
): ProviderCheckResult {
  return {
    name,
    ok: false,
    detail: describeProviderCheckFailure(name, error),
  };
}

export function okProviderCheck(name: ProviderCheckName, detail: string): ProviderCheckResult {
  return { name, ok: true, detail };
}

export function asCheckError(error: unknown): AiError {
  return error instanceof AiError
    ? error
    : new AiError(error instanceof Error ? error.message : "Request failed.", {
        cause: error,
        status: getErrorStatus(error),
      });
}
