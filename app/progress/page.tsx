import type { Metadata } from "next";

import { PageIntro } from "@/components/page-intro";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return (
    <PageShell>
      <PageIntro
        label="Progress"
        title="Your first answers will become a study map."
        description="After a few attempts Marginalia can tell which topics are solid and which need another pass, and it will put the weakest ones first."
      />
    </PageShell>
  );
}
