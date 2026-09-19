import { handleRouteError, jsonOk } from "@/lib/documents/http";
import { retryDocumentParse } from "@/lib/documents/repository";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const document = await retryDocumentParse(id);
    return jsonOk({ document });
  } catch (error) {
    return handleRouteError(error);
  }
}
