import { describe, expect, it } from "vitest";

import { chatThinkingBody, readChatThinkingMode } from "@/lib/ai/chat-thinking";

describe("readChatThinkingMode", () => {
  it("disables thinking on DeepSeek when the env var is unset", () => {
    expect(readChatThinkingMode("https://api.deepseek.com/v1", undefined)).toBe(
      "disabled",
    );
    expect(chatThinkingBody("https://api.deepseek.com/v1", undefined)).toEqual({
      thinking: { type: "disabled" },
    });
  });

  it("does not send a thinking field for local Ollama", () => {
    expect(readChatThinkingMode("http://127.0.0.1:11434/v1", undefined)).toBeNull();
    expect(chatThinkingBody("http://127.0.0.1:11434/v1", undefined)).toEqual({});
  });

  it("honours an explicit override", () => {
    expect(readChatThinkingMode("https://api.deepseek.com/v1", "enabled")).toBe(
      "enabled",
    );
    expect(readChatThinkingMode("http://127.0.0.1:11434/v1", "disabled")).toBe(
      "disabled",
    );
  });

  it("rejects unknown values", () => {
    expect(() => readChatThinkingMode("https://api.deepseek.com/v1", "maybe")).toThrow(
      /AI_CHAT_THINKING/,
    );
  });
});
