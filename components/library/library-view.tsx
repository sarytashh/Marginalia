"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { INVALID_PDF_MESSAGE, PDF_ACCEPT } from "@/lib/pdf/constants";
import { validatePdfFile } from "@/lib/pdf/validate";

type LibraryViewProps = {
  initialDocuments: LibraryDocument[];
  initialError: string | null;
};

export function LibraryView({ initialDocuments, initialError }: LibraryViewProps) {
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
        <div>
          <p className="label-editorial">Today</p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-reading">
              <h1 className="font-serif text-ink text-[34px] leading-[1.12] font-normal md:text-[52px]">
                Your materials.
              </h1>
              <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
                Add another lecture PDF, or wait while Marginalia finishes reading a
                document already in the list.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <p className="text-muted-ink text-[13px] tabular-nums">
                {documents.length === 1 ? "1 document" : `${documents.length} documents`}
              </p>
              <button
                type="button"
                onClick={openFilePicker}
                className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 shrink-0 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
              >
                Add material
              </button>
            </div>
          </div>

          <section className="mt-14" aria-labelledby="materials-heading">
            <h2 id="materials-heading" className="sr-only">
              Your materials
            </h2>
            <div>
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
            </div>
          </section>
        </div>
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
