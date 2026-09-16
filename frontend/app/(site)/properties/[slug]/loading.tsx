import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main>
      <Skeleton className="h-[60vh] max-h-[560px] w-full rounded-none" />
      <div className="px-6 lg:px-16 py-10 grid lg:grid-cols-[1fr_360px] gap-12">
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-7 w-1/4 mt-2" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </main>
  );
}
