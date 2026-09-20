export type ChatThinkingMode = "disabled" | "enabled";

export type ChatThinkingBody = {
  thinking: { type: ChatThinkingMode };
};

export function chatThinkingBody(
  baseUrl: string,
  rawMode: string | undefined,
): ChatThinkingBody | Record<string, never> {
  const mode = readChatThinkingMode(baseUrl, rawMode);
  if (mode === null) {
    return {};
  }
  return { thinking: { type: mode } };
}

export function readChatThinkingMode(
  baseUrl: string,
  rawMode: string | undefined,
): ChatThinkingMode | null {
  const trimmed = rawMode?.trim();
  if (trimmed === "disabled" || trimmed === "enabled") {
    return trimmed;
  }
  if (trimmed !== undefined && trimmed !== "") {
    throw new Error("AI_CHAT_THINKING must be disabled or enabled.");
  }
  // DeepSeek V4 defaults thinking on; JSON grading/generation needs the final content field.
  if (isDeepSeekChatHost(baseUrl)) {
    return "disabled";
  }
  return null;
}

function isDeepSeekChatHost(baseUrl: string): boolean {
  try {
    const host = new URL(baseUrl).hostname;
    return host === "api.deepseek.com" || host.endsWith(".deepseek.com");
  } catch {
    return false;
  }
}
