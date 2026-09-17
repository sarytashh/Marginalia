import { afterEach, describe, expect, it } from "vitest";

import { getAiEnv } from "@/lib/ai/env";

const original = {
  AI_API_KEY: process.env.AI_API_KEY,
  AI_BASE_URL: process.env.AI_BASE_URL,
  AI_CHAT_MODEL: process.env.AI_CHAT_MODEL,
  AI_EMBEDDING_DIMENSIONS: process.env.AI_EMBEDDING_DIMENSIONS,
  AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL,
};

afterEach(() => {
  process.env.AI_API_KEY = original.AI_API_KEY;
  process.env.AI_BASE_URL = original.AI_BASE_URL;
  process.env.AI_CHAT_MODEL = original.AI_CHAT_MODEL;
  process.env.AI_EMBEDDING_DIMENSIONS = original.AI_EMBEDDING_DIMENSIONS;
  process.env.AI_EMBEDDING_MODEL = original.AI_EMBEDDING_MODEL;
});

describe("getAiEnv", () => {
  it("reads the OpenAI-compatible provider settings", () => {
    process.env.AI_BASE_URL = "https://api.siliconflow.cn/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_CHAT_MODEL = "deepseek-ai/DeepSeek-V3";
    process.env.AI_EMBEDDING_MODEL = "BAAI/bge-m3";
    process.env.AI_EMBEDDING_DIMENSIONS = "1024";

    expect(getAiEnv()).toEqual({
      apiKey: "test-key",
      baseUrl: "https://api.siliconflow.cn/v1",
      chatModel: "deepseek-ai/DeepSeek-V3",
      embeddingDimensions: 1024,
      embeddingModel: "BAAI/bge-m3",
    });
  });

  it("throws when the API key is missing", () => {
    process.env.AI_BASE_URL = "https://api.siliconflow.cn/v1";
    delete process.env.AI_API_KEY;
    process.env.AI_CHAT_MODEL = "deepseek-ai/DeepSeek-V3";
    process.env.AI_EMBEDDING_MODEL = "BAAI/bge-m3";
    process.env.AI_EMBEDDING_DIMENSIONS = "1024";

    expect(() => getAiEnv()).toThrow(/AI_API_KEY/);
  });

  it("throws when embedding dimensions are not a positive integer", () => {
    process.env.AI_BASE_URL = "https://api.siliconflow.cn/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_CHAT_MODEL = "deepseek-ai/DeepSeek-V3";
    process.env.AI_EMBEDDING_MODEL = "BAAI/bge-m3";
    process.env.AI_EMBEDDING_DIMENSIONS = "nope";

    expect(() => getAiEnv()).toThrow(/AI_EMBEDDING_DIMENSIONS/);
  });
});
