import { Skeleton } from "@/components/ui/skeleton";

export default function FleetLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 flex-1 min-w-56" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
