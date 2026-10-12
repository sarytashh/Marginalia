import type { Enums } from "@/lib/database.types";

type DocumentStatus = Enums<"document_status">;

const IN_PROGRESS_STATUSES: ReadonlySet<DocumentStatus> = new Set([
  "uploaded",
  "parsing",
  "embedding",
  "generating",
]);

// Background jobs run inside this Node process. If the process stops (a dev
// server is closed, a host restarts), the document row keeps its in-progress
// status forever and every action refuses it. Tracking which documents have
// a live job lets readers tell "still working" from "interrupted".
//
// Stored on globalThis so Next.js dev reloads of this module keep one set.
const STORE_KEY = Symbol.for("marginalia.activeDocumentJobs");

// Counts, not a set: a second request that claims and then fails must not
// clear the claim of a job that is still running.
type GlobalWithJobs = typeof globalThis & { [STORE_KEY]?: Map<string, number> };

function activeJobs(): Map<string, number> {
  const scope = globalThis as GlobalWithJobs;
  scope[STORE_KEY] ??= new Map<string, number>();
  return scope[STORE_KEY];
}

/**
 * Marks a document as having a live job and returns a release function.
 * Claim before writing an in-progress status, so a concurrent reader never
 * sees that status without a matching live job.
 */
export function claimDocumentJob(documentId: string): () => void {
  const jobs = activeJobs();
  jobs.set(documentId, (jobs.get(documentId) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const remaining = (jobs.get(documentId) ?? 1) - 1;
    if (remaining > 0) {
      jobs.set(documentId, remaining);
    } else {
      jobs.delete(documentId);
    }
  };
}

/** Wraps a job so its claim is released when it settles, success or not. */
export function releaseWhenSettled(
  release: () => void,
  job: () => Promise<void>,
): () => Promise<void> {
  return async () => {
    try {
      await job();
    } finally {
      release();
    }
  };
}

export function isDocumentJobActive(documentId: string): boolean {
  return (activeJobs().get(documentId) ?? 0) > 0;
}

export function isInterruptedStatus(status: DocumentStatus, jobActive: boolean): boolean {
  return IN_PROGRESS_STATUSES.has(status) && !jobActive;
}
