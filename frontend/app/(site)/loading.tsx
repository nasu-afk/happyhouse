import { Skeleton } from "@/components/ui/Skeleton";
import { PropertyGridSkeleton } from "@/components/property/PropertyCardSkeleton";

export default function Loading() {
  return (
    <main>
      <section className="bg-night min-h-[560px]" />
      <section className="px-6 lg:px-16 py-16">
        <Skeleton className="h-9 w-56 mb-8" />
        <PropertyGridSkeleton count={6} />
      </section>
    </main>
  );
}
