import { createChatClient, createEmbeddingClient } from "../lib/ai/client";
import {
  asCheckError,
  failedProviderCheck,
  formatProviderCheckReport,
  okProviderCheck,
  providerCheckExitCode,
  type ProviderCheckResult,
} from "../lib/ai/check";
import { getChatEnv, getEmbeddingEnv } from "../lib/ai/env";
import { AiError } from "../lib/ai/errors";

async function checkChat(): Promise<ProviderCheckResult> {
  try {
    const env = getChatEnv();
    const client = createChatClient();
    const chat = await client.chat.completions.create({
      model: env.chatModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Respond with a single JSON object only.",
        },
        {
          role: "user",
          content: '{"task":"ping"} Return {"ok": true}',
        },
      ],
    });
    const content = chat.choices[0]?.message.content;
    if (content === undefined || content === null || content === "") {
      throw new AiError("The chat endpoint returned an empty response.");
    }
    return okProviderCheck("chat", "ok");
  } catch (error) {
    return failedProviderCheck("chat", asCheckError(error));
  }
}

async function checkEmbeddings(): Promise<ProviderCheckResult> {
  try {
    const env = getEmbeddingEnv();
    const client = createEmbeddingClient();
    const embedding = await client.embeddings.create({
      model: env.embeddingModel,
      input: "Marginalia connectivity check",
    });
    const vector = embedding.data[0]?.embedding;
    if (vector === undefined) {
      throw new AiError("The embedding endpoint returned no vector.");
    }
    if (vector.length !== env.embeddingDimensions) {
      throw new AiError(
        `Embedding length was ${vector.length}, expected ${env.embeddingDimensions}.`,
      );
    }
    return okProviderCheck("embeddings", `ok (${vector.length} dimensions)`);
  } catch (error) {
    return failedProviderCheck("embeddings", asCheckError(error));
  }
}

async function main(): Promise<void> {
  const results = [await checkChat(), await checkEmbeddings()];
  console.log(formatProviderCheckReport(results));
  process.exitCode = providerCheckExitCode(results);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "The AI provider check failed.";
  console.error(message);
  process.exitCode = 1;
});
