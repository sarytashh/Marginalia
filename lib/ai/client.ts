import OpenAI from "openai";

import { getAiEnv } from "@/lib/ai/env";

export function createAiClient(): OpenAI {
  const env = getAiEnv();

  return new OpenAI({
    apiKey: env.apiKey,
    baseURL: env.baseUrl,
    maxRetries: 0,
    timeout: 60_000,
  });
}
