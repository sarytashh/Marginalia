import { handleRouteError, jsonError, jsonOk } from "@/lib/documents/http";
import {
  deleteDocument,
  getOwnedDocument,
  renameDocument,
} from "@/lib/documents/repository";
import { toLibraryDocument } from "@/lib/documents/map";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const row = await getOwnedDocument(id);
    return jsonOk({ document: toLibraryDocument(row) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    const title =
      typeof body === "object" && body !== null && "title" in body
        ? body.title
        : undefined;

    if (typeof title !== "string") {
      return jsonError("Give this material a title.", 400);
    }

    const document = await renameDocument(id, title);
    return jsonOk({ document });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteDocument(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
