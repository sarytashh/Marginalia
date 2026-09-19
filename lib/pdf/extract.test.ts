import { describe, expect, it } from "vitest";

import { NO_TEXT_PDF_MESSAGE } from "@/lib/pdf/constants";
import { extractPdf } from "@/lib/pdf/extract";
import { buildMinimalPdf, buildSampleLecturePdf } from "@/lib/pdf/minimal-pdf";
import { hasExtractableText, readPdfInfoTitle } from "@/lib/pdf/text";

describe("readPdfInfoTitle", () => {
  it("returns a trimmed Title string and ignores empty or non-string values", () => {
    expect(readPdfInfoTitle({ Title: "  Graphs  " })).toBe("Graphs");
    expect(readPdfInfoTitle({ Title: "" })).toBeNull();
    expect(readPdfInfoTitle({ Title: 12 })).toBeNull();
    expect(readPdfInfoTitle(null)).toBeNull();
  });
});

describe("hasExtractableText", () => {
  it("treats whitespace-only pages as empty", () => {
    expect(
      hasExtractableText([
        { pageNumber: 1, content: "   \n\t" },
        { pageNumber: 2, content: "" },
      ]),
    ).toBe(false);
  });

  it("accepts a document with text on any page", () => {
    expect(
      hasExtractableText([
        { pageNumber: 1, content: "" },
        { pageNumber: 2, content: "Dijkstra" },
      ]),
    ).toBe(true);
  });
});

describe("extractPdf", () => {
  it("keeps per-page text, page numbers, and the metadata title", async () => {
    const bytes = buildMinimalPdf({
      title: "Lecture 06",
      pages: ["A graph has vertices and edges.", "Dijkstra uses a priority queue."],
    });

    const extracted = await extractPdf(bytes);

    expect(extracted.pageCount).toBe(2);
    expect(extracted.pages).toHaveLength(2);
    expect(extracted.pages[0]?.pageNumber).toBe(1);
    expect(extracted.pages[1]?.pageNumber).toBe(2);
    expect(extracted.pages[0]?.content).toContain("vertices");
    expect(extracted.pages[1]?.content).toContain("priority queue");
    expect(extracted.metadataTitle).toBe("Lecture 06");
    expect(hasExtractableText(extracted.pages)).toBe(true);
  });

  it("rejects a scanned-style PDF with no extractable text", async () => {
    const bytes = buildMinimalPdf({ pages: ["", ""] });
    const extracted = await extractPdf(bytes);

    expect(extracted.pageCount).toBe(2);
    expect(hasExtractableText(extracted.pages)).toBe(false);
    expect(NO_TEXT_PDF_MESSAGE).toMatch(/scanned image/);
  });

  it("extracts the sample lecture fixture", async () => {
    const extracted = await extractPdf(buildSampleLecturePdf());
    expect(extracted.pageCount).toBe(3);
    expect(extracted.pages[2]?.content).toMatch(/Bellman-Ford/);
  });
});
