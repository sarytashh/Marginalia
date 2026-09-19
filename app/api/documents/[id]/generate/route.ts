import { after } from "next/server";

import { DocumentError, handleRouteError, jsonOk } from "@/lib/documents/http";
import { prepareQuestionGeneration } from "@/lib/documents/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const options = await readGenerateOptions(request);
    const { document, job } = await prepareQuestionGeneration(id, options);
    after(() => job());
    return jsonOk({ document });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function readGenerateOptions(
  request: Request,
): Promise<{ replace?: boolean; topicId?: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {};
  }

  if (typeof body !== "object" || body === null) {
    return {};
  }

  const topicId = readOptionalString(body, "topicId");
  const replace = readOptionalBoolean(body, "replace");

  if (replace === true && topicId !== undefined) {
    throw new DocumentError(
      "Regenerate the whole material, or add questions to one topic — not both.",
      400,
    );
  }

  return {
    ...(topicId === undefined ? {} : { topicId }),
    ...(replace === undefined ? {} : { replace }),
  };
}

function readOptionalString(body: object, key: string): string | undefined {
  if (!(key in body)) {
    return undefined;
  }
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return value.trim();
}

function readOptionalBoolean(body: object, key: string): boolean | undefined {
  if (!(key in body)) {
    return undefined;
  }
  const value = (body as Record<string, unknown>)[key];
  return value === true;
}
