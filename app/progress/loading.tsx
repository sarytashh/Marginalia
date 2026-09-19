import { ProgressSkeletons } from "@/components/progress/progress-skeletons";
import { PageShell } from "@/components/page-shell";

export default function ProgressLoading() {
  return (
    <PageShell>
      <ProgressSkeletons />
    </PageShell>
  );
}
