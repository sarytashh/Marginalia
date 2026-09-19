"use client";

import { FileText } from "lucide-react";
import { useId } from "react";

import { formatSourceDisclosure } from "@/lib/study/format";

type SourceDisclosureProps = {
  documentTitle: string;
  excerpt: string | null;
  open: boolean;
  pages: readonly number[];
  onOpenChange: (open: boolean) => void;
};

export function SourceDisclosure({
  documentTitle,
  excerpt,
  open,
  pages,
  onOpenChange,
}: SourceDisclosureProps) {
  const panelId = useId();
  const label = formatSourceDisclosure(documentTitle, pages);

  return (
    <div className="mt-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className="text-muted-ink hover:text-ink inline-flex min-h-11 items-center gap-2 text-[12px] tracking-[0.08em] uppercase"
      >
        <FileText className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </button>

      {open && excerpt ? (
        <div id={panelId} className="mt-3">
          <blockquote className="bg-paper border-burgundy text-ink border-l-2 px-4 py-3 font-serif text-[16px] leading-[1.6]">
            {excerpt}
          </blockquote>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-ink hover:text-ink mt-2 min-h-11 text-[13px]"
          >
            Hide source
          </button>
        </div>
      ) : null}
    </div>
  );
}
