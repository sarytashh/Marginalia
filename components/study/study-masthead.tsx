import { formatSessionProgress } from "@/lib/study/format";

type StudyMastheadProps = {
  completedCount: number;
  currentIndex: number;
  onEnd?: () => void;
  total: number;
};

export function StudyMasthead({
  completedCount,
  currentIndex,
  onEnd,
  total,
}: StudyMastheadProps) {
  const progressPercent = total === 0 ? 0 : ((currentIndex + 1) / total) * 100;

  return (
    <header className="border-rule bg-canvas/95 supports-[backdrop-filter]:bg-canvas/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="max-w-app mx-auto flex h-14 w-full items-center gap-4 px-5 md:h-16 md:px-8 lg:px-12">
        <p className="font-serif text-ink text-[22px] leading-none md:text-[26px]">
          Marginalia
        </p>

        {total > 0 ? (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <p className="text-muted-ink text-[12px] tabular-nums tracking-[0.04em]">
              {formatSessionProgress(currentIndex, total)}
            </p>
            <div
              className="bg-rule h-px w-28 max-w-full"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={currentIndex + 1}
              aria-label={`Question ${currentIndex + 1} of ${total}`}
            >
              <div
                className="bg-burgundy h-px duration-200 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {onEnd ? (
          <button
            type="button"
            onClick={onEnd}
            className="text-muted-ink hover:text-ink min-h-11 shrink-0 text-[14px] font-medium"
          >
            End session
          </button>
        ) : (
          <span className="text-muted-ink hidden min-h-11 text-[12px] tracking-[0.04em] sm:inline">
            {completedCount === 0
              ? "Session complete"
              : `${completedCount} saved`}
          </span>
        )}
      </div>
    </header>
  );
}
