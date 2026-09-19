import { INVALID_PDF_MESSAGE } from "@/lib/pdf/constants";

type DropOverlayProps = {
  isDragging: boolean;
  isInvalid: boolean;
};

export function DropOverlay({ isDragging, isInvalid }: DropOverlayProps) {
  if (!isDragging) {
    return null;
  }

  return (
    <div
      className="bg-canvas/70 fixed inset-0 z-50 flex items-center justify-center px-5"
      role="status"
      aria-live="polite"
    >
      <div
        className={`bg-paper flex h-[min(36rem,calc(100vh-3rem))] w-full max-w-3xl items-center justify-center rounded-sm border px-8 text-center ${
          isInvalid ? "border-state-shaky" : "border-burgundy"
        }`}
      >
        <div>
          <p className="font-serif text-ink text-[32px] leading-[1.2] md:text-[40px]">
            {isInvalid ? "This file cannot be added" : "Release to add this document"}
          </p>
          <p
            className={`mt-4 text-[15px] leading-[1.6] ${
              isInvalid ? "text-state-shaky" : "text-muted-ink"
            }`}
          >
            {INVALID_PDF_MESSAGE}
          </p>
        </div>
      </div>
    </div>
  );
}
