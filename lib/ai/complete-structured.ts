import { z } from "zod";

import { createChatClient } from "@/lib/ai/client";
import { getChatEnv } from "@/lib/ai/env";
import { AiError, toAiError } from "@/lib/ai/errors";
import { JSON_OUTPUT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { withRetry } from "@/lib/ai/retry";

export type CompleteJson = (input: {
  system: string;
  user: string;
  temperature: number;
}) => Promise<string>;

export type CompleteStructuredOptions<Schema extends z.ZodType> = {
  completeJson?: CompleteJson;
  schema: Schema;
  system: string;
  temperature?: number;
  user: string;
};

async function completeJsonWithProvider(input: {
  system: string;
  user: string;
  temperature: number;
}): Promise<string> {
  const env = getChatEnv();
  const client = createChatClient();

  try {
    const response = await client.chat.completions.create({
      model: env.chatModel,
      temperature: input.temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (content === undefined || content === null || content === "") {
      throw new AiError("The study model returned an empty response. Try again.", {
        retryable: false,
      });
    }

    return content;
  } catch (error) {
    throw toAiError(error);
  }
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON";
    throw new AiError(`The study model returned JSON that could not be parsed: ${detail}`, {
      retryable: false,
    });
  }
}

export async function completeStructured<Schema extends z.ZodType>(
  options: CompleteStructuredOptions<Schema>,
): Promise<z.infer<Schema>> {
  const completeJson = options.completeJson ?? completeJsonWithProvider;
  const temperature = options.temperature ?? 0;
  const system = `${JSON_OUTPUT_SYSTEM_PROMPT}\n\n${options.system}`;

  const firstText = await withRetry(() =>
    completeJson({
      system,
      user: options.user,
      temperature,
    }),
  );

  const firstParsed = tryParseAndValidate(options.schema, firstText);
  if (firstParsed.ok) {
    return firstParsed.data;
  }

  const retryUser = `${options.user}

Your previous response was not valid:
${firstParsed.issue}

Return only JSON that matches the required schema.`;

  const secondText = await withRetry(() =>
    completeJson({
      system,
      user: retryUser,
      temperature,
    }),
  );

  const secondParsed = tryParseAndValidate(options.schema, secondText);
  if (secondParsed.ok) {
    return secondParsed.data;
  }

  throw new AiError(
    "The study model returned a response that did not match the expected shape. Try again.",
    { retryable: false },
  );
}

function tryParseAndValidate<Schema extends z.ZodType>(
  schema: Schema,
  text: string,
): { ok: true; data: z.infer<Schema> } | { ok: false; issue: string } {
  try {
    const parsed = parseJsonObject(text);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return { ok: true, data: result.data };
    }
    return { ok: false, issue: z.prettifyError(result.error) };
  } catch (error) {
    if (error instanceof AiError) {
      return { ok: false, issue: error.message };
    }
    return { ok: false, issue: "The response was not valid JSON." };
  }
}
