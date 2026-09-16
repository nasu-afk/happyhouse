import { Skeleton } from "@/components/ui/Skeleton";

export function PropertyCardSkeleton() {
  return (
    <div className="border border-line rounded-card overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-2/5 mt-1" />
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <PropertyCardSkeleton key={i} />)}
    </div>
  );
}
