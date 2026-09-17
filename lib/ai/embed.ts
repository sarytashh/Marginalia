import { batchItems, EMBEDDING_BATCH_SIZE } from "@/lib/ai/batch";
import { createAiClient } from "@/lib/ai/client";
import { getAiEnv } from "@/lib/ai/env";
import { AiError, toAiError } from "@/lib/ai/errors";
import { withRetry, type RetryOptions } from "@/lib/ai/retry";

export type EmbedBatch = (input: string[]) => Promise<number[][]>;

export type EmbedTextsOptions = {
  dimensions?: number;
  embedBatch?: EmbedBatch;
  maxBatchSize?: number;
  retry?: RetryOptions;
};

async function embedBatchWithProvider(input: string[]): Promise<number[][]> {
  const env = getAiEnv();
  const client = createAiClient();

  try {
    const response = await client.embeddings.create({
      model: env.embeddingModel,
      input,
    });

    return [...response.data]
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);
  } catch (error) {
    throw toAiError(error);
  }
}

export async function embedTexts(
  texts: string[],
  options: EmbedTextsOptions = {},
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const embedBatch = options.embedBatch ?? embedBatchWithProvider;
  const maxBatchSize = options.maxBatchSize ?? EMBEDDING_BATCH_SIZE;
  const dimensions = options.dimensions ?? getAiEnv().embeddingDimensions;
  const vectors: number[][] = [];

  for (const batch of batchItems(texts, maxBatchSize)) {
    const embeddings = await withRetry(() => embedBatch(batch), options.retry);

    if (embeddings.length !== batch.length) {
      throw new AiError("The study model returned the wrong number of embeddings. Try again.", {
        retryable: false,
      });
    }

    for (const embedding of embeddings) {
      if (embedding.length !== dimensions) {
        throw new AiError(
          `The embedding length was ${embedding.length}, but AI_EMBEDDING_DIMENSIONS is ${dimensions}.`,
          { retryable: false },
        );
      }
      vectors.push(embedding);
    }
  }

  return vectors;
}
