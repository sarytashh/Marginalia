import { z } from "zod";

import { isProductionRuntime } from "@/lib/dev";
import { handleRouteError, jsonError, jsonOk } from "@/lib/documents/http";
import { getOwnedDocument } from "@/lib/documents/repository";
import { searchChunks } from "@/lib/retrieval";

export const runtime = "nodejs";
export const maxDuration = 60;

const searchBodySchema = z.object({
  documentId: z.string().uuid(),
  query: z.string(),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request) {
  if (isProductionRuntime()) {
    return jsonError("That page is not available.", 404);
  }

  try {
    const json: unknown = await request.json();
    const parsed = searchBodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError("Choose a document and enter a search query.", 400);
    }

    await getOwnedDocument(parsed.data.documentId);
    const chunks = await searchChunks(
      parsed.data.documentId,
      parsed.data.query,
      parsed.data.limit,
    );
    return jsonOk({ chunks });
  } catch (error) {
    return handleRouteError(error);
  }
}
