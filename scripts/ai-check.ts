import { createAiClient } from "../lib/ai/client";
import { getAiEnv } from "../lib/ai/env";
import { AiError } from "../lib/ai/errors";

async function main(): Promise<void> {
  const env = getAiEnv();
  const client = createAiClient();

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

  console.log(`Embedding endpoint: ok (${vector.length} dimensions)`);
  console.log("Chat endpoint: ok");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "The AI provider check failed.";
  console.error(message);
  process.exitCode = 1;
});
