import { extractText, getDocumentProxy, getMeta } from "unpdf";

import { readPdfInfoTitle } from "@/lib/pdf/text";
import type { ExtractedPage, ExtractedPdf } from "@/lib/pdf/types";

export async function extractPdf(bytes: Uint8Array): Promise<ExtractedPdf> {
  // PDF.js rejects Node Buffer even though Buffer extends Uint8Array.
  const data = new Uint8Array(bytes);
  const pdf = await getDocumentProxy(data);

  const [{ text, totalPages }, metadataTitle] = await Promise.all([
    extractText(pdf, { mergePages: false }),
    readMetadataTitle(pdf),
  ]);

  const pageTexts = Array.isArray(text) ? text : [text];
  const pages: ExtractedPage[] = pageTexts.map((content, index) => ({
    pageNumber: index + 1,
    content: content.trim(),
  }));

  return {
    metadataTitle,
    pageCount: totalPages,
    pages,
  };
}

async function readMetadataTitle(
  pdf: Parameters<typeof getMeta>[0],
): Promise<string | null> {
  try {
    const { info } = await getMeta(pdf);
    return readPdfInfoTitle(info);
  } catch {
    return null;
  }
}
