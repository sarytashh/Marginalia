"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { DeleteMaterialDialog } from "@/components/document/delete-material-dialog";
import { ProcessingSteps } from "@/components/library/processing-steps";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatQuestionCount,
  formatTopicCount,
} from "@/lib/documents/format";
import { isDocumentProcessing, statusLabel } from "@/lib/documents/processing";
import type { LibraryDocument } from "@/lib/documents/types";
import { formatPageCount, formatUploadedOn } from "@/lib/pdf/format";
import { titleFromFilename } from "@/lib/pdf/title";

type DocumentRowProps = {
  document: LibraryDocument;
  onDelete: (document: LibraryDocument) => Promise<void>;
  onRename: (document: LibraryDocument, title: string) => Promise<void>;
  onRetry: (document: LibraryDocument) => Promise<void>;
};

export function DocumentRow({
  document,
  onDelete,
  onRename,
  onRetry,
}: DocumentRowProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const showPipeline = document.status !== "ready";

  const metadata = [
    formatPageCount(document.pageCount),
    `Uploaded ${formatUploadedOn(document.createdAt)}`,
    statusLabel(document),
    document.topicCount > 0 ? formatTopicCount(document.topicCount) : null,
    document.questionCount > 0 ? formatQuestionCount(document.questionCount) : null,
  ].filter((part): part is string => part !== null);

  const filenameDiffers =
    titleFromFilename(document.filename).toLowerCase() !== document.title.toLowerCase();

  return (
    <article className="border-rule hover:bg-paper/80 group border-t py-6 transition-colors duration-200 ease-out">
      <div className="flex items-start gap-4">
        <Link href={`/documents/${document.id}`} className="min-w-0 flex-1">
          <h3 className="font-serif text-ink group-hover:text-burgundy text-[22px] leading-[1.25] font-normal transition-colors duration-200 ease-out">
            {document.title}
          </h3>
          {filenameDiffers ? (
            <p className="text-muted-ink mt-1 truncate text-[13px]">{document.filename}</p>
          ) : null}
          <p className="text-muted-ink mt-2 text-[12px] tracking-[0.04em]">
            {metadata.join(" · ")}
          </p>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${document.title}`}
            className="text-muted-ink hover:text-ink inline-flex size-11 items-center justify-center rounded-sm"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={() => setRenameOpen(true)}>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showPipeline ? <ProcessingSteps document={document} /> : null}

      {document.status === "failed" ? (
        <div className="mt-5 flex flex-col items-start gap-3">
          <button
            type="button"
            disabled={retrying}
            onClick={async () => {
              setRetryError(null);
              setRetrying(true);
              try {
                await onRetry(document);
              } catch (error) {
                setRetryError(
                  error instanceof Error
                    ? error.message
                    : "Marginalia could not retry this step.",
                );
              } finally {
                setRetrying(false);
              }
            }}
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out disabled:opacity-60"
          >
            {retrying ? "Trying this step again…" : "Try this step again"}
          </button>
          {retryError ? (
            <p className="text-state-shaky text-[13px]">{retryError}</p>
          ) : (
            <p className="text-muted-ink text-[13px]">
              Completed work is kept. You can also delete this material.
            </p>
          )}
        </div>
      ) : isDocumentProcessing(document) ? (
        <p className="text-muted-ink mt-5 text-[13px]">
          You can leave this page. Processing continues in the background.
        </p>
      ) : null}

      {renameOpen ? (
        <RenameDialog
          key={document.id}
          document={document}
          onOpenChange={setRenameOpen}
          onRename={onRename}
        />
      ) : null}
      <DeleteMaterialDialog
        document={document}
        onDelete={onDelete}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
    </article>
  );
}

function RenameDialog({
  document,
  onOpenChange,
  onRename,
}: {
  document: LibraryDocument;
  onOpenChange: (open: boolean) => void;
  onRename: (document: LibraryDocument, title: string) => Promise<void>;
}) {
  const titleId = useId();
  const [title, setTitle] = useState(document.title);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (nextTitle === "") {
      setError("Give this material a title.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onRename(document, nextTitle);
      onOpenChange(false);
    } catch (renameError) {
      setError(
        renameError instanceof Error
          ? renameError.message
          : "Marginalia could not rename this material.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-rule bg-paper rounded-sm sm:max-w-md"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-serif text-[22px] font-normal">
              Rename this material
            </DialogTitle>
            <DialogDescription>The title appears in your library.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-sm"
            />
            {error ? <p className="text-state-shaky text-[13px]">{error}</p> : null}
          </div>
          <DialogFooter className="border-rule mt-6 flex-col gap-2 rounded-none border-t bg-transparent sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-sm">
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
