import { Skeleton } from "@/components/ui/skeleton";

export function StudySkeletons() {
  return (
    <div aria-hidden className="max-w-[45rem]">
      <Skeleton className="h-3 w-28 rounded-sm" />
      <Skeleton className="mt-5 h-10 w-full max-w-lg rounded-sm" />
      <Skeleton className="mt-3 h-10 w-4/5 rounded-sm" />
      <Skeleton className="mt-6 h-3 w-40 rounded-sm" />
      <Skeleton className="mt-8 h-36 w-full rounded-sm" />
      <Skeleton className="mt-6 h-11 w-36 rounded-sm" />
    </div>
  );
}
