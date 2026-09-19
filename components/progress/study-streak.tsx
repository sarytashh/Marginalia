import { formatStreak, formatStreakMeta } from "@/lib/progress/format";
import type { ProgressStreak } from "@/lib/progress/types";

type StudyStreakProps = {
  streak: ProgressStreak;
};

export function StudyStreak({ streak }: StudyStreakProps) {
  return (
    <div>
      <p className="font-serif text-ink text-[34px] leading-[1.15] font-normal md:text-[40px]">
        {formatStreak(streak.current)}
      </p>
      <p className="text-muted-ink mt-3 text-[13px] tracking-[0.02em]">
        {formatStreakMeta(streak)}
      </p>
    </div>
  );
}
