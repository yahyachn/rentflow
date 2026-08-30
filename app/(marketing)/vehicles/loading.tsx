import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
