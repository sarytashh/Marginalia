"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { DocumentRow } from "@/components/library/document-row";
import { DropOverlay } from "@/components/library/drop-overlay";
import { EmptyLibrary } from "@/components/library/empty-library";
import { LibrarySkeletons } from "@/components/library/library-skeletons";
import { UploadDialog } from "@/components/library/upload-dialog";
import {
  deleteLibraryDocument,
  fetchLibraryDocuments,
  renameLibraryDocument,
  retryLibraryDocument,
} from "@/lib/documents/client";
import { isDocumentProcessing } from "@/lib/documents/processing";
import type { LibraryDocument } from "@/lib/documents/types";
import {
  formatLibraryHeading,
  formatLibrarySummary,
} from "@/lib/library/heading";
import { INVALID_PDF_MESSAGE, PDF_ACCEPT } from "@/lib/pdf/constants";
import { validatePdfFile } from "@/lib/pdf/validate";

type LibraryViewProps = {
  dueCount: number;
  initialDocuments: LibraryDocument[];
  initialError: string | null;
};

export function LibraryView({
  dueCount,
  initialDocuments,
  initialError,
}: LibraryViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    initialError ? "error" : "ready",
  );
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragState, setDragState] = useState<"idle" | "valid" | "invalid">("idle");
  const [dropError, setDropError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const next = await fetchLibraryDocuments();
      setDocuments(next);
      setLoadState("ready");
      setLoadError(null);
    } catch (error) {
      setLoadState("error");
      setLoadError(
        error instanceof Error
          ? error.message
          : "Marginalia could not load your materials. Try again.",
      );
    }
  }, []);

  const processing = documents.some(isDocumentProcessing);

  useEffect(() => {
    if (!processing) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchLibraryDocuments()
        .then((next) => setDocuments(next))
        .catch((error: unknown) => {
          console.error(error);
        });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [processing]);

  useEffect(() => {
    let depth = 0;

    function hasFiles(event: DragEvent): boolean {
      return event.dataTransfer?.types.includes("Files") ?? false;
    }

    function onDragEnter(event: DragEvent) {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      depth += 1;
      const item = event.dataTransfer?.items[0];
      const invalid =
        item !== undefined &&
        item.kind === "file" &&
        item.type !== "" &&
        item.type !== "application/pdf";
      setDragState(invalid ? "invalid" : "valid");
    }

    function onDragOver(event: DragEvent) {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      const transfer = event.dataTransfer;
      if (transfer) {
        transfer.dropEffect = "copy";
      }
    }

    function onDragLeave(event: DragEvent) {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        setDragState("idle");
      }
    }

    function onDrop(event: DragEvent) {
      event.preventDefault();
      depth = 0;
      setDragState("idle");
      const file = event.dataTransfer?.files[0];
      if (!file) {
        return;
      }
      offerFile(file);
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  function offerFile(file: File) {
    const error = validatePdfFile(file);
    if (error) {
      setDropError(INVALID_PDF_MESSAGE);
      setSelectedFile(null);
      return;
    }

    setDropError(null);
    setSelectedFile(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={PDF_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            offerFile(file);
          }
        }}
      />

      <DropOverlay
        isDragging={dragState !== "idle"}
        isInvalid={dragState === "invalid"}
      />

      {loadState === "loading" ? <LibrarySkeletons /> : null}

      {loadState === "error" ? (
        <div>
          <p className="label-editorial">Library</p>
          <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal md:text-[52px]">
            Your materials could not be loaded.
          </h1>
          <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoadState("loading");
              void loadDocuments();
            }}
            className="bg-burgundy text-paper hover:bg-burgundy-hover mt-8 inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
          >
            Try loading again
          </button>
        </div>
      ) : null}

      {loadState === "ready" && documents.length === 0 ? (
        <EmptyLibrary onChoosePdf={openFilePicker} />
      ) : null}

      {loadState === "ready" && documents.length > 0 ? (
        <LibrarySpread
          documents={documents}
          dueCount={dueCount}
          onAddMaterial={openFilePicker}
        >
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              onRename={async (current, title) => {
                const updated = await renameLibraryDocument(current.id, title);
                setDocuments((existing) =>
                  existing.map((item) => (item.id === updated.id ? updated : item)),
                );
                toast("The title is updated.");
              }}
              onDelete={async (current) => {
                await deleteLibraryDocument(current.id);
                setDocuments((existing) =>
                  existing.filter((item) => item.id !== current.id),
                );
                toast(`${current.title} was deleted.`);
              }}
              onRetry={async (current) => {
                const updated = await retryLibraryDocument(current.id);
                setDocuments((existing) =>
                  existing.map((item) => (item.id === updated.id ? updated : item)),
                );
              }}
            />
          ))}
        </LibrarySpread>
      ) : null}

      {dropError ? (
        <p className="border-state-shaky text-state-shaky mt-8 border-l-2 pl-4 text-[14px] leading-[1.6]">
          {dropError}
        </p>
      ) : null}

      {selectedFile ? (
        <UploadDialog
          key={`${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}`}
          file={selectedFile}
          onCancel={() => setSelectedFile(null)}
          onUploaded={(document) => {
            setSelectedFile(null);
            setDocuments((existing) => [
              document,
              ...existing.filter((item) => item.id !== document.id),
            ]);
          }}
        />
      ) : null}
    </>
  );
}

function LibrarySpread({
  children,
  documents,
  dueCount,
  onAddMaterial,
}: {
  children: ReactNode;
  documents: LibraryDocument[];
  dueCount: number;
  onAddMaterial: () => void;
}) {
  const questionCount = documents.reduce(
    (sum, document) => sum + document.questionCount,
    0,
  );
  const hasDue = dueCount > 0;
  const canStudyAhead = questionCount > 0;

  return (
    <div>
      <p className="label-editorial">Today</p>
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-reading">
          <h1 className="font-serif text-ink text-[34px] leading-[1.12] font-normal md:text-[52px]">
            {formatLibraryHeading(dueCount, questionCount)}
          </h1>
          <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
            {formatLibrarySummary(dueCount, questionCount)}
          </p>
          <p className="text-muted-ink mt-4 text-[12px] tracking-[0.04em]">
            {[
              dueCount > 0 ? `${dueCount} due now` : "Nothing due now",
              documents.length === 1
                ? "1 document"
                : `${documents.length} documents`,
            ].join(" · ")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {hasDue ? (
            <Link
              href="/study"
              className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
            >
              Start due review
            </Link>
          ) : canStudyAhead ? (
            <Link
              href="/study?ahead=1"
              className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
            >
              Study ahead
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAddMaterial}
              className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
            >
              Add material
            </button>
          )}
          {hasDue && canStudyAhead ? (
            <Link
              href="/study?ahead=1"
              className="text-burgundy hover:text-burgundy-hover inline-flex min-h-11 items-center text-[14px] font-medium"
            >
              Study ahead
            </Link>
          ) : null}
          {hasDue || canStudyAhead ? (
            <button
              type="button"
              onClick={onAddMaterial}
              className="text-muted-ink hover:text-ink inline-flex min-h-11 items-center text-[14px] font-medium"
            >
              Add material
            </button>
          ) : null}
        </div>
      </div>

      <section className="mt-14" aria-labelledby="materials-heading">
        <h2 id="materials-heading" className="font-serif text-ink text-[26px] leading-[1.2] font-normal">
          Your materials
        </h2>
        <div className="mt-2">{children}</div>
      </section>
    </div>
  );
}
