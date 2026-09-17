export type AiEnv = {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingDimensions: number;
  embeddingModel: string;
};

function readRequiredText(
  name: "AI_BASE_URL" | "AI_API_KEY" | "AI_CHAT_MODEL" | "AI_EMBEDDING_MODEL",
): string {
  const value =
    name === "AI_BASE_URL"
      ? process.env.AI_BASE_URL
      : name === "AI_API_KEY"
        ? process.env.AI_API_KEY
        : name === "AI_CHAT_MODEL"
          ? process.env.AI_CHAT_MODEL
          : process.env.AI_EMBEDDING_MODEL;

  if (value === undefined || value === "") {
    throw new Error(
      `Missing ${name}. Copy the AI_* lines from .env.example into .env.local and fill them in.`,
    );
  }

  return value;
}

function readEmbeddingDimensions(): number {
  const raw = process.env.AI_EMBEDDING_DIMENSIONS;
  if (raw === undefined || raw === "") {
    throw new Error(
      "Missing AI_EMBEDDING_DIMENSIONS. Copy the AI_* lines from .env.example into .env.local and fill them in.",
    );
  }

  const dimensions = Number.parseInt(raw, 10);
  if (!Number.isFinite(dimensions) || dimensions <= 0) {
    throw new Error(
      "AI_EMBEDDING_DIMENSIONS must be a positive integer (1024 for BAAI/bge-m3).",
    );
  }

  return dimensions;
}

export function getAiEnv(): AiEnv {
  return {
    apiKey: readRequiredText("AI_API_KEY"),
    baseUrl: readRequiredText("AI_BASE_URL"),
    chatModel: readRequiredText("AI_CHAT_MODEL"),
    embeddingDimensions: readEmbeddingDimensions(),
    embeddingModel: readRequiredText("AI_EMBEDDING_MODEL"),
  };
}
