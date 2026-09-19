import { describe, expect, it } from "vitest";

import {
  getProcessingSteps,
  isDocumentProcessing,
  statusLabel,
} from "@/lib/documents/processing";
import type { LibraryDocument } from "@/lib/documents/types";

function document(
  overrides: Partial<LibraryDocument> = {},
): LibraryDocument {
  return {
    id: "doc-1",
    title: "Lecture 06",
    filename: "lecture-06.pdf",
    pageCount: null,
    status: "uploaded",
    errorMessage: null,
    createdAt: "2026-09-19T10:00:00.000Z",
    ...overrides,
  };
}

describe("isDocumentProcessing", () => {
  it("is true while a parse has not produced a page count", () => {
    expect(isDocumentProcessing(document({ status: "uploaded" }))).toBe(true);
    expect(isDocumentProcessing(document({ status: "parsing" }))).toBe(true);
  });

  it("is false after reading finishes, or when the document is ready or failed", () => {
    expect(
      isDocumentProcessing(document({ status: "parsing", pageCount: 12 })),
    ).toBe(false);
    expect(
      isDocumentProcessing(document({ status: "generating", pageCount: 12 })),
    ).toBe(false);
    expect(isDocumentProcessing(document({ status: "ready", pageCount: 12 }))).toBe(
      false,
    );
    expect(isDocumentProcessing(document({ status: "failed" }))).toBe(false);
  });

  it("is true while embeddings are being written", () => {
    expect(
      isDocumentProcessing(document({ status: "embedding", pageCount: 12 })),
    ).toBe(true);
  });
});

describe("getProcessingSteps", () => {
  it("marks reading as the active step immediately after upload", () => {
    const steps = getProcessingSteps(document({ status: "uploaded" }));
    expect(steps[0]?.state).toBe("complete");
    expect(steps[1]?.state).toBe("active");
    expect(steps[2]?.state).toBe("pending");
  });

  it("marks reading complete once page_count is stored", () => {
    const steps = getProcessingSteps(
      document({ status: "parsing", pageCount: 18 }),
    );
    expect(steps[1]?.state).toBe("complete");
    expect(steps[1]?.detail).toBe("Marginalia read 18 pages.");
    expect(steps[2]?.state).toBe("pending");
  });

  it("marks the reading step failed for a scanned PDF even when page_count is known", () => {
    const steps = getProcessingSteps(
      document({
        status: "failed",
        pageCount: 2,
        errorMessage:
          "Couldn't read that PDF — it may be a scanned image without a text layer. Try a different file.",
      }),
    );
    expect(steps[1]?.state).toBe("failed");
    expect(steps[1]?.detail).toMatch(/scanned image/);
    expect(steps[0]?.state).toBe("complete");
    expect(steps[2]?.state).toBe("pending");
  });

  it("marks preparing search index as active while embedding", () => {
    const steps = getProcessingSteps(
      document({ status: "embedding", pageCount: 18 }),
    );
    expect(steps[1]?.state).toBe("complete");
    expect(steps[2]?.state).toBe("active");
    expect(steps[2]?.detail).toMatch(/embedding/);
    expect(steps[3]?.state).toBe("pending");
  });

  it("marks the search index complete after embedding, with later steps muted", () => {
    const steps = getProcessingSteps(
      document({ status: "generating", pageCount: 18 }),
    );
    expect(steps[1]?.state).toBe("complete");
    expect(steps[2]?.state).toBe("complete");
    expect(steps[2]?.detail).toBe("Search index is ready.");
    expect(steps[3]?.state).toBe("pending");
    expect(steps[4]?.state).toBe("pending");
    expect(steps[5]?.state).toBe("pending");
  });
});

describe("statusLabel", () => {
  it("pairs processing color with a word", () => {
    expect(statusLabel({ status: "parsing", pageCount: null })).toBe("Reading pages");
    expect(statusLabel({ status: "parsing", pageCount: 3 })).toBe("Read");
    expect(statusLabel({ status: "embedding", pageCount: 3 })).toBe(
      "Preparing search index",
    );
    expect(statusLabel({ status: "generating", pageCount: 3 })).toBe("Indexed");
    expect(statusLabel({ status: "failed", pageCount: 2 })).toBe("Failed");
  });
});
