import { Skeleton } from "@/components/ui/skeleton";

export function LibrarySkeletons() {
  return (
    <div aria-hidden>
      <Skeleton className="h-3 w-24 rounded-sm" />
      <Skeleton className="mt-5 h-12 w-72 max-w-full rounded-sm" />
      <Skeleton className="mt-4 h-4 w-full max-w-md rounded-sm" />
      <div className="mt-12 space-y-0">
        <LibraryRowSkeleton />
        <LibraryRowSkeleton />
        <LibraryRowSkeleton />
      </div>
    </div>
  );
}

function LibraryRowSkeleton() {
  return (
    <div className="border-rule border-t py-6">
      <Skeleton className="h-6 w-2/3 max-w-sm rounded-sm" />
      <Skeleton className="mt-3 h-3 w-48 rounded-sm" />
      <Skeleton className="mt-5 h-1 w-full rounded-sm" />
    </div>
  );
}
