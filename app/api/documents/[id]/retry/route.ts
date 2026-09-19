import { after } from "next/server";

import { handleRouteError, jsonOk } from "@/lib/documents/http";
import { prepareDocumentRetry } from "@/lib/documents/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { document, job } = await prepareDocumentRetry(id);
    after(() => job());
    return jsonOk({ document });
  } catch (error) {
    return handleRouteError(error);
  }
}
