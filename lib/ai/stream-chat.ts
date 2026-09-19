import { createChatClient } from "@/lib/ai/client";
import { getChatEnv } from "@/lib/ai/env";
import { AiError, toAiError } from "@/lib/ai/errors";

export async function streamChatJson(
  input: {
    maxTokens?: number;
    onText?: (accumulated: string) => void;
    system: string;
    temperature: number;
    user: string;
  },
): Promise<string> {
  const env = getChatEnv();
  const client = createChatClient();

  try {
    console.info("chat completion stream", { model: env.chatModel });
    const stream = await client.chat.completions.create({
      model: env.chatModel,
      temperature: input.temperature,
      max_tokens: input.maxTokens ?? 2048,
      stream: true,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    });

    let text = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (typeof delta !== "string" || delta === "") {
        continue;
      }
      text += delta;
      input.onText?.(text);
    }

    if (text.trim() === "") {
      throw new AiError("The study model returned an empty response. Try again.", {
        retryable: true,
      });
    }

    return text;
  } catch (error) {
    throw toAiError(error);
  }
}
