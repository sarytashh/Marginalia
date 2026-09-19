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

export type PipelineDocument = Pick<
  LibraryDocument,
  "chunkCount" | "errorMessage" | "pageCount" | "questionCount" | "status" | "topicCount"
>;

const STEP_INDEX: Record<PipelineStepId, number> = {
  upload: 0,
  reading: 1,
  index: 2,
  topics: 3,
  questions: 4,
  ready: 5,
};

export function isDocumentProcessing(
  document: Pick<LibraryDocument, "pageCount" | "status">,
): boolean {
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

export function getFailedStepId(document: PipelineDocument): PipelineStepId | null {
  if (document.status !== "failed") {
    return null;
  }

  if (document.pageCount === null || document.errorMessage === NO_TEXT_PDF_MESSAGE) {
    return "reading";
  }

  if (document.chunkCount === 0) {
    return "index";
  }

  if (document.topicCount === 0) {
    return "topics";
  }

  return "questions";
}

export function getActiveStepId(document: PipelineDocument): PipelineStepId | null {
  switch (document.status) {
    case "uploaded":
    case "parsing":
      return document.pageCount === null ? "reading" : null;
    case "embedding":
      return "index";
    case "generating":
      return document.topicCount === 0 ? "topics" : "questions";
    case "ready":
    case "failed":
      return null;
  }
}

function completedThrough(document: PipelineDocument): number {
  switch (document.status) {
    case "uploaded":
      return STEP_INDEX.upload;
    case "parsing":
      return document.pageCount === null ? STEP_INDEX.upload : STEP_INDEX.reading;
    case "embedding":
      return STEP_INDEX.reading;
    case "generating":
      return document.topicCount === 0 ? STEP_INDEX.index : STEP_INDEX.topics;
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

export function getProcessingSteps(document: PipelineDocument): PipelineStepView[] {
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
  document: PipelineDocument,
): string | null {
  if (id === "reading" && state === "complete" && document.pageCount !== null) {
    return document.pageCount === 1
      ? "Marginalia read 1 page."
      : `Marginalia read ${document.pageCount} pages.`;
  }

  if (id === "reading" && state === "active") {
    return "Marginalia is reading the text on each page.";
  }

  if (id === "index" && state === "active") {
    return "Marginalia is embedding each passage so it can find it later.";
  }

  if (id === "index" && state === "complete") {
    return "Search index is ready.";
  }

  if (id === "topics" && state === "active") {
    return "Marginalia is naming the subjects in this material.";
  }

  if (id === "topics" && state === "complete" && document.topicCount > 0) {
    return document.topicCount === 1
      ? "Found 1 topic."
      : `Found ${document.topicCount} topics.`;
  }

  if (id === "questions" && state === "active") {
    return "Marginalia is writing questions from retrieved passages.";
  }

  if (id === "questions" && state === "complete" && document.questionCount > 0) {
    return document.questionCount === 1
      ? "Wrote 1 question."
      : `Wrote ${document.questionCount} questions.`;
  }

  if (state === "failed") {
    return document.errorMessage;
  }

  return null;
}

export function statusLabel(document: PipelineDocument): string {
  switch (document.status) {
    case "uploaded":
      return "Reading pages";
    case "parsing":
      return document.pageCount === null ? "Reading pages" : "Read";
    case "embedding":
      return "Preparing search index";
    case "generating":
      return document.topicCount === 0 ? "Finding topics" : "Writing questions";
    case "ready":
      return "Ready to study";
    case "failed":
      return "Failed";
  }
}
