import type { Metadata } from "next";

import { PageIntro } from "@/components/page-intro";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Study",
};

export default function StudyPage() {
  return (
    <PageShell>
      <PageIntro
        label="Study"
        title="Nothing is waiting for review."
        description="Once you add material, Marginalia will ask you one question at a time here, grade what you write, and show you the passage it came from."
      />
    </PageShell>
  );
}
