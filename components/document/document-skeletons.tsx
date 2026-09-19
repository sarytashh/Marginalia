import { Skeleton } from "@/components/ui/skeleton";

export function DocumentDetailSkeletons() {
  return (
    <div aria-hidden>
      <Skeleton className="h-3 w-20 rounded-sm" />
      <Skeleton className="mt-3 h-3 w-24 rounded-sm" />
      <Skeleton className="mt-5 h-12 w-80 max-w-full rounded-sm" />
      <Skeleton className="mt-4 h-4 w-full max-w-md rounded-sm" />
      <div className="mt-10 flex gap-3">
        <Skeleton className="h-11 w-44 rounded-sm" />
        <Skeleton className="h-11 w-40 rounded-sm" />
      </div>
      <div className="border-rule mt-16 space-y-0 border-t">
        <TopicRowSkeleton />
        <TopicRowSkeleton />
        <TopicRowSkeleton />
      </div>
    </div>
  );
}

function TopicRowSkeleton() {
  return (
    <div className="border-rule border-b py-6">
      <Skeleton className="h-6 w-2/3 max-w-sm rounded-sm" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg rounded-sm" />
      <Skeleton className="mt-4 h-px w-full rounded-sm" />
    </div>
  );
}
