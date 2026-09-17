import { afterEach, describe, expect, it } from "vitest";

import { getAiEnv, getChatEnv, getEmbeddingEnv } from "@/lib/ai/env";

const original = {
  AI_CHAT_API_KEY: process.env.AI_CHAT_API_KEY,
  AI_CHAT_BASE_URL: process.env.AI_CHAT_BASE_URL,
  AI_CHAT_MODEL: process.env.AI_CHAT_MODEL,
  AI_EMBEDDING_API_KEY: process.env.AI_EMBEDDING_API_KEY,
  AI_EMBEDDING_BASE_URL: process.env.AI_EMBEDDING_BASE_URL,
  AI_EMBEDDING_DIMENSIONS: process.env.AI_EMBEDDING_DIMENSIONS,
  AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL,
};

function setSplitEnv(): void {
  process.env.AI_CHAT_BASE_URL = "https://api.deepseek.com/v1";
  process.env.AI_CHAT_API_KEY = "chat-key";
  process.env.AI_CHAT_MODEL = "deepseek-chat";
  process.env.AI_EMBEDDING_BASE_URL = "http://127.0.0.1:11434/v1";
  process.env.AI_EMBEDDING_API_KEY = "ollama";
  process.env.AI_EMBEDDING_MODEL = "bge-m3";
  process.env.AI_EMBEDDING_DIMENSIONS = "1024";
}

afterEach(() => {
  process.env.AI_CHAT_API_KEY = original.AI_CHAT_API_KEY;
  process.env.AI_CHAT_BASE_URL = original.AI_CHAT_BASE_URL;
  process.env.AI_CHAT_MODEL = original.AI_CHAT_MODEL;
  process.env.AI_EMBEDDING_API_KEY = original.AI_EMBEDDING_API_KEY;
  process.env.AI_EMBEDDING_BASE_URL = original.AI_EMBEDDING_BASE_URL;
  process.env.AI_EMBEDDING_DIMENSIONS = original.AI_EMBEDDING_DIMENSIONS;
  process.env.AI_EMBEDDING_MODEL = original.AI_EMBEDDING_MODEL;
});

describe("getChatEnv and getEmbeddingEnv", () => {
  it("reads chat and embeddings from separate OpenAI-compatible endpoints", () => {
    setSplitEnv();

    expect(getChatEnv()).toEqual({
      apiKey: "chat-key",
      baseUrl: "https://api.deepseek.com/v1",
      chatModel: "deepseek-chat",
    });
    expect(getEmbeddingEnv()).toEqual({
      apiKey: "ollama",
      baseUrl: "http://127.0.0.1:11434/v1",
      embeddingDimensions: 1024,
      embeddingModel: "bge-m3",
    });
    expect(getAiEnv()).toEqual({
      chat: {
        apiKey: "chat-key",
        baseUrl: "https://api.deepseek.com/v1",
        chatModel: "deepseek-chat",
      },
      embeddings: {
        apiKey: "ollama",
        baseUrl: "http://127.0.0.1:11434/v1",
        embeddingDimensions: 1024,
        embeddingModel: "bge-m3",
      },
    });
  });

  it("can load chat settings when embedding variables are missing", () => {
    process.env.AI_CHAT_BASE_URL = "https://api.deepseek.com/v1";
    process.env.AI_CHAT_API_KEY = "chat-key";
    process.env.AI_CHAT_MODEL = "deepseek-chat";
    delete process.env.AI_EMBEDDING_BASE_URL;
    delete process.env.AI_EMBEDDING_API_KEY;
    delete process.env.AI_EMBEDDING_MODEL;
    delete process.env.AI_EMBEDDING_DIMENSIONS;

    expect(getChatEnv().chatModel).toBe("deepseek-chat");
    expect(() => getEmbeddingEnv()).toThrow(/AI_EMBEDDING_/);
  });

  it("throws when the chat API key is missing", () => {
    setSplitEnv();
    delete process.env.AI_CHAT_API_KEY;

    expect(() => getChatEnv()).toThrow(/AI_CHAT_API_KEY/);
  });

  it("throws when embedding dimensions are not a positive integer", () => {
    setSplitEnv();
    process.env.AI_EMBEDDING_DIMENSIONS = "nope";

    expect(() => getEmbeddingEnv()).toThrow(/AI_EMBEDDING_DIMENSIONS/);
  });
});
