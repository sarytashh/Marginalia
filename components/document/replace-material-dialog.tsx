"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReplaceMaterialDialogProps = {
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  questionCount: number;
  title: string;
};

export function ReplaceMaterialDialog({
  open,
  onOpenChange,
  onConfirm,
  questionCount,
  title,
}: ReplaceMaterialDialogProps) {
  const keepRef = useRef<HTMLButtonElement>(null);

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
            Replace topics and questions?
          </DialogTitle>
          <DialogDescription>
            The {questionCount === 1 ? "question" : `${questionCount} questions`} in {title},
            with your answers and review schedule, will be removed and written again from
            the PDF. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-rule mt-6 flex flex-col gap-2 rounded-none border-t bg-transparent sm:flex-row sm:justify-end">
          <Button ref={keepRef} type="button" onClick={() => onOpenChange(false)}>
            Keep current questions
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="text-state-shaky hover:text-state-shaky"
          >
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
