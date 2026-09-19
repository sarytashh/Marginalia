import { LibrarySkeletons } from "@/components/library/library-skeletons";
import { PageShell } from "@/components/page-shell";

export default function LibraryLoading() {
  return (
    <PageShell>
      <LibrarySkeletons />
    </PageShell>
  );
}
