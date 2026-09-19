import { handleRouteError, jsonOk } from "@/lib/documents/http";
import { listLibraryDocuments } from "@/lib/documents/repository";
import { uploadPdfDocument } from "@/lib/documents/upload";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  try {
    const documents = await listLibraryDocuments();
    return jsonOk({ documents });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const document = await uploadPdfDocument(formData);
    return jsonOk({ document }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
