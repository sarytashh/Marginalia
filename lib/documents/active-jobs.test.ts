import { describe, expect, it } from "vitest";

import {
  claimDocumentJob,
  isDocumentJobActive,
  isInterruptedStatus,
  releaseWhenSettled,
} from "@/lib/documents/active-jobs";

describe("isInterruptedStatus", () => {
  it("treats in-progress statuses without a live job as interrupted", () => {
    expect(isInterruptedStatus("uploaded", false)).toBe(true);
    expect(isInterruptedStatus("parsing", false)).toBe(true);
    expect(isInterruptedStatus("embedding", false)).toBe(true);
    expect(isInterruptedStatus("generating", false)).toBe(true);
  });

  it("leaves running and finished documents alone", () => {
    expect(isInterruptedStatus("generating", true)).toBe(false);
    expect(isInterruptedStatus("ready", false)).toBe(false);
    expect(isInterruptedStatus("failed", false)).toBe(false);
  });
});

describe("claimDocumentJob", () => {
  it("marks a document active until released", () => {
    const release = claimDocumentJob("doc-claim");
    expect(isDocumentJobActive("doc-claim")).toBe(true);
    release();
    expect(isDocumentJobActive("doc-claim")).toBe(false);
  });

  it("releases after the job settles, even when it throws", async () => {
    const release = claimDocumentJob("doc-throw");
    const job = releaseWhenSettled(release, async () => {
      expect(isDocumentJobActive("doc-throw")).toBe(true);
      throw new Error("boom");
    });

    await expect(job()).rejects.toThrow("boom");
    expect(isDocumentJobActive("doc-throw")).toBe(false);
  });

  it("keeps a running job active when an overlapping claim is released", () => {
    const running = claimDocumentJob("doc-overlap");
    const rejected = claimDocumentJob("doc-overlap");
    rejected();
    expect(isDocumentJobActive("doc-overlap")).toBe(true);
    running();
    expect(isDocumentJobActive("doc-overlap")).toBe(false);
  });

  it("does not drop a newer claim when an old release runs twice", () => {
    const first = claimDocumentJob("doc-twice");
    first();
    const second = claimDocumentJob("doc-twice");
    first();
    expect(isDocumentJobActive("doc-twice")).toBe(true);
    second();
  });
});
