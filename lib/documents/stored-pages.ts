import "server-only";

import { z } from "zod";

import { DocumentError } from "@/lib/documents/http";
import { DOCUMENTS_BUCKET } from "@/lib/documents/types";
import { pagesStoragePath } from "@/lib/documents/storage-paths";
import type { ExtractedPdf } from "@/lib/pdf/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const storedPagesSchema = z.object({
  metadataTitle: z.string().nullable(),
  pageCount: z.number().int().nonnegative(),
  pages: z.array(
    z.object({
      pageNumber: z.number().int().positive(),
      content: z.string(),
    }),
  ),
});

export async function loadStoredPages(
  userId: string,
  documentId: string,
): Promise<ExtractedPdf | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(pagesStoragePath(userId, documentId));

  if (error || data === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await data.text());
  } catch (cause) {
    console.error(cause);
    throw new DocumentError(
      "Marginalia could not read the extracted pages. Try this step again.",
      500,
    );
  }

  const result = storedPagesSchema.safeParse(parsed);
  if (!result.success) {
    throw new DocumentError(
      "Marginalia could not read the extracted pages. Try this step again.",
      500,
    );
  }

  return result.data;
}
