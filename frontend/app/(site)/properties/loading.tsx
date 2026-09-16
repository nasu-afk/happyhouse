import { Skeleton } from "@/components/ui/Skeleton";
import { PropertyGridSkeleton } from "@/components/property/PropertyCardSkeleton";

export default function Loading() {
  return (
    <main className="px-6 lg:px-16 py-12">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <PropertyGridSkeleton count={9} />
    </main>
  );
}
