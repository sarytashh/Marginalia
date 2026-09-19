"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LibraryDocument } from "@/lib/documents/types";

type DeleteMaterialDialogProps = {
  document: LibraryDocument;
  onDelete: (document: LibraryDocument) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function DeleteMaterialDialog({
  document,
  open,
  onOpenChange,
  onDelete,
}: DeleteMaterialDialogProps) {
  const keepRef = useRef<HTMLButtonElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await onDelete(document);
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Marginalia could not delete this material.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-rule bg-paper rounded-sm sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          keepRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-[22px] font-normal">
            Delete this material?
          </DialogTitle>
          <DialogDescription>
            {document.title} and its topics, questions, attempts, and review schedule
            will be removed. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-state-shaky mt-3 text-[13px]">{error}</p> : null}
        <DialogFooter className="border-rule mt-6 flex flex-col gap-2 rounded-none border-t bg-transparent sm:flex-row sm:justify-end">
          <Button ref={keepRef} type="button" onClick={() => onOpenChange(false)}>
            Keep material
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="text-state-shaky hover:text-state-shaky"
          >
            {deleting ? "Deleting…" : "Delete material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
