import Link from "next/link";

import { PageIntro } from "@/components/page-intro";

type EmptyProgressProps = {
  hasQuestions: boolean;
};

export function EmptyProgress({ hasQuestions }: EmptyProgressProps) {
  return (
    <PageIntro
      label="Progress"
      title="Your first answers will become a study map."
      description="After a few attempts Marginalia can tell which topics are solid and which need another pass, and it will put the weakest ones first."
    >
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {hasQuestions ? (
          <Link
            href="/study"
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
          >
            Start studying
          </Link>
        ) : (
          <Link
            href="/"
            className="bg-burgundy text-paper hover:bg-burgundy-hover inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-[14px] font-medium"
          >
            Add material
          </Link>
        )}
      </div>
    </PageIntro>
  );
}
