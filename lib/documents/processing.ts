import type { LibraryDocument } from "@/lib/documents/types";
import { NO_TEXT_PDF_MESSAGE } from "@/lib/pdf/constants";

export const PIPELINE_STEPS = [
  { id: "upload", label: "Upload complete" },
  { id: "reading", label: "Reading pages" },
  { id: "index", label: "Preparing search index" },
  { id: "topics", label: "Finding topics" },
  { id: "questions", label: "Writing questions" },
  { id: "ready", label: "Ready to study" },
] as const;

export type PipelineStepId = (typeof PIPELINE_STEPS)[number]["id"];

export type PipelineStepState = "complete" | "active" | "pending" | "failed";

export type PipelineStepView = {
  detail: string | null;
  id: PipelineStepId;
  label: string;
  state: PipelineStepState;
};

const STEP_INDEX: Record<PipelineStepId, number> = {
  upload: 0,
  reading: 1,
  index: 2,
  topics: 3,
  questions: 4,
  ready: 5,
};

export function isDocumentProcessing(document: Pick<LibraryDocument, "pageCount" | "status">): boolean {
  if (document.status === "ready" || document.status === "failed") {
    return false;
  }

  if (document.status === "parsing" && document.pageCount !== null) {
    return false;
  }

  return (
    document.status === "uploaded" ||
    document.status === "parsing" ||
    document.status === "embedding" ||
    document.status === "generating"
  );
}

export function getFailedStepId(
  document: Pick<LibraryDocument, "errorMessage" | "pageCount" | "status">,
): PipelineStepId | null {
  if (document.status !== "failed") {
    return null;
  }

  if (document.pageCount === null || document.errorMessage === NO_TEXT_PDF_MESSAGE) {
    return "reading";
  }

  return "index";
}

export function getActiveStepId(
  document: Pick<LibraryDocument, "pageCount" | "status">,
): PipelineStepId | null {
  switch (document.status) {
    case "uploaded":
    case "parsing":
      return document.pageCount === null ? "reading" : null;
    case "embedding":
      return "index";
    case "generating":
      return "topics";
    case "ready":
    case "failed":
      return null;
  }
}

function completedThrough(
  document: Pick<LibraryDocument, "errorMessage" | "pageCount" | "status">,
): number {
  switch (document.status) {
    case "uploaded":
      return STEP_INDEX.upload;
    case "parsing":
      return document.pageCount === null ? STEP_INDEX.upload : STEP_INDEX.reading;
    case "embedding":
      return STEP_INDEX.reading;
    case "generating":
      return STEP_INDEX.index;
    case "ready":
      return STEP_INDEX.ready;
    case "failed": {
      const failed = getFailedStepId(document);
      if (failed === null) {
        return STEP_INDEX.upload;
      }
      return Math.max(0, STEP_INDEX[failed] - 1);
    }
  }
}

export function getProcessingSteps(
  document: Pick<LibraryDocument, "errorMessage" | "pageCount" | "status">,
): PipelineStepView[] {
  const failedStep = getFailedStepId(document);
  const activeStep = getActiveStepId(document);
  const completeThrough = completedThrough(document);

  return PIPELINE_STEPS.map((step) => {
    let state: PipelineStepState = "pending";
    if (failedStep === step.id) {
      state = "failed";
    } else if (activeStep === step.id) {
      state = "active";
    } else if (STEP_INDEX[step.id] <= completeThrough) {
      state = "complete";
    }

    return {
      id: step.id,
      label: step.label,
      state,
      detail: stepDetail(step.id, state, document),
    };
  });
}

function stepDetail(
  id: PipelineStepId,
  state: PipelineStepState,
  document: Pick<LibraryDocument, "errorMessage" | "pageCount" | "status">,
): string | null {
  if (id === "reading" && state === "complete" && document.pageCount !== null) {
    return document.pageCount === 1
      ? "Marginalia read 1 page."
      : `Marginalia read ${document.pageCount} pages.`;
  }

  if (id === "reading" && state === "active") {
    return "Marginalia is reading the text on each page.";
  }

  if (state === "failed") {
    return document.errorMessage;
  }

  return null;
}

export function statusLabel(
  document: Pick<LibraryDocument, "pageCount" | "status">,
): string {
  switch (document.status) {
    case "uploaded":
      return "Reading pages";
    case "parsing":
      return document.pageCount === null ? "Reading pages" : "Read";
    case "embedding":
      return "Preparing search index";
    case "generating":
      return "Writing questions";
    case "ready":
      return "Ready to study";
    case "failed":
      return "Failed";
  }
}
