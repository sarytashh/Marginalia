import OpenAI from "openai";

import { getChatEnv, getEmbeddingEnv } from "@/lib/ai/env";

function createOpenAiClient(apiKey: string, baseURL: string, timeout: number): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL,
    maxRetries: 0,
    timeout,
  });
}

export function createChatClient(): OpenAI {
  const env = getChatEnv();
  return createOpenAiClient(env.apiKey, env.baseUrl, 60_000);
}

export function createEmbeddingClient(): OpenAI {
  const env = getEmbeddingEnv();
  // First local bge-m3 load on Ollama can exceed a 60s HTTP timeout.
  return createOpenAiClient(env.apiKey, env.baseUrl, 120_000);
}
