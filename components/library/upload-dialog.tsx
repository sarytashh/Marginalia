"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { uploadLibraryDocument } from "@/lib/documents/client";
import type { LibraryDocument } from "@/lib/documents/types";
import { formatFileSize } from "@/lib/pdf/format";
import { titleFromFilename } from "@/lib/pdf/title";

type UploadDialogProps = {
  file: File;
  onCancel: () => void;
  onUploaded: (document: LibraryDocument) => void;
};

export function UploadDialog({ file, onCancel, onUploaded }: UploadDialogProps) {
  const titleId = useId();
  const [title, setTitle] = useState(titleFromFilename(file.name));
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(currentTitle: string) {
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const document = await uploadLibraryDocument({
        file,
        title: currentTitle,
        onProgress: setProgress,
      });
      onUploaded(document);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Marginalia could not upload this PDF. Your file is still selected.",
      );
      setUploading(false);
    }
  }

  function resolvedTitle(): string {
    return title.trim() === "" ? titleFromFilename(file.name) : title.trim();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) {
      return;
    }

    const nextTitle = resolvedTitle();
    setTitle(nextTitle);
    void upload(nextTitle);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !uploading) {
          onCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={!uploading}
        className="border-rule bg-paper rounded-sm sm:max-w-md"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-serif text-[22px] font-normal">
              {uploading ? "Uploading" : error ? "Upload did not finish" : "Add this document"}
            </DialogTitle>
            <DialogDescription>
              {file.name} · {formatFileSize(file.size)}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-2">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              value={title}
              disabled={uploading}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-sm"
            />
          </div>

          {uploading ? (
            <div className="mt-5">
              <Progress value={progress} className="rounded-sm" />
              <p className="text-muted-ink mt-2 text-[13px] tabular-nums">
                {progress}% uploaded
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="text-state-shaky mt-4 text-[13px] leading-[1.55]">{error}</p>
          ) : null}

          <DialogFooter className="border-rule mt-6 flex-col gap-2 rounded-none border-t bg-transparent sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              disabled={uploading}
              onClick={onCancel}
            >
              Cancel
            </Button>
            {error ? (
              <Button
                type="button"
                className="rounded-sm"
                onClick={() => void upload(resolvedTitle())}
              >
                Retry
              </Button>
            ) : (
              <Button type="submit" disabled={uploading} className="rounded-sm">
                Add this document
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
