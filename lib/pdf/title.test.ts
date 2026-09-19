import { describe, expect, it } from "vitest";

import { INVALID_PDF_MESSAGE, MAX_PDF_BYTES } from "@/lib/pdf/constants";
import { titleFromFilename, sanitizeStorageFilename } from "@/lib/pdf/title";
import {
  hasPdfMagicBytes,
  isLikelyPdfFile,
  validatePdfBytes,
  validatePdfFile,
} from "@/lib/pdf/validate";

describe("titleFromFilename", () => {
  it("strips the .pdf extension and turns underscores into spaces", () => {
    expect(titleFromFilename("Lecture_06-Graphs.pdf")).toBe("Lecture 06-Graphs");
  });

  it("falls back when the name is only an extension", () => {
    expect(titleFromFilename(".pdf")).toBe("Untitled material");
  });
});

describe("sanitizeStorageFilename", () => {
  it("keeps a safe basename and rejects path segments", () => {
    expect(sanitizeStorageFilename("../../secret notes.pdf")).toBe("secret notes.pdf");
  });

  it("adds a .pdf suffix when it is missing", () => {
    expect(sanitizeStorageFilename("notes")).toBe("notes.pdf");
  });
});

describe("validatePdfFile", () => {
  it("accepts a PDF by filename even when the browser leaves type empty", () => {
    expect(
      validatePdfFile({ name: "lecture.pdf", type: "", size: 1200 }),
    ).toBeNull();
  });

  it("rejects a non-PDF and an oversized file with the same public message", () => {
    expect(
      validatePdfFile({ name: "notes.txt", type: "text/plain", size: 12 }),
    ).toBe(INVALID_PDF_MESSAGE);
    expect(
      validatePdfFile({
        name: "huge.pdf",
        type: "application/pdf",
        size: MAX_PDF_BYTES + 1,
      }),
    ).toBe(INVALID_PDF_MESSAGE);
  });
});

describe("isLikelyPdfFile", () => {
  it("accepts application/pdf regardless of filename", () => {
    expect(isLikelyPdfFile({ name: "download", type: "application/pdf" })).toBe(true);
  });
});

describe("validatePdfBytes", () => {
  it("rejects a .pdf name whose bytes are not a PDF", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    expect(
      validatePdfBytes(bytes, {
        name: "fake.pdf",
        type: "application/pdf",
        size: bytes.byteLength,
      }),
    ).toBe(INVALID_PDF_MESSAGE);
  });

  it("accepts %PDF magic bytes", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(hasPdfMagicBytes(bytes)).toBe(true);
    expect(
      validatePdfBytes(bytes, {
        name: "ok.pdf",
        type: "application/pdf",
        size: bytes.byteLength,
      }),
    ).toBeNull();
  });
});
