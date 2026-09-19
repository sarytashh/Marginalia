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

type EndSessionDialogProps = {
  completedCount: number;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function EndSessionDialog({
  completedCount,
  onConfirm,
  onOpenChange,
  open,
}: EndSessionDialogProps) {
  const continueRef = useRef<HTMLButtonElement>(null);

  const savedCopy =
    completedCount === 0
      ? "You have not saved an answer yet."
      : completedCount === 1
        ? "Your 1 completed answer is already saved."
        : `Your ${completedCount} completed answers are already saved.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-rule bg-paper rounded-sm sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          continueRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-[22px] font-normal">
            End this session?
          </DialogTitle>
          <DialogDescription>{savedCopy}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-rule mt-6 flex flex-col gap-2 rounded-none border-t bg-transparent sm:flex-row sm:justify-end">
          <Button ref={continueRef} type="button" onClick={() => onOpenChange(false)}>
            Continue studying
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onConfirm}
            className="text-muted-ink hover:text-ink"
          >
            End session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
