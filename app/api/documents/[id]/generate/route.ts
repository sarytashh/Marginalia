import { after } from "next/server";

import { handleRouteError, jsonOk } from "@/lib/documents/http";
import { prepareQuestionGeneration } from "@/lib/documents/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const topicId = await readTopicId(request);
    const { document, job } = await prepareQuestionGeneration(id, topicId);
    after(() => job());
    return jsonOk({ document });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function readTopicId(request: Request): Promise<string | undefined> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return undefined;
  }

  if (typeof body !== "object" || body === null || !("topicId" in body)) {
    return undefined;
  }

  const topicId = body.topicId;
  if (typeof topicId !== "string" || topicId.trim() === "") {
    return undefined;
  }

  return topicId.trim();
}
