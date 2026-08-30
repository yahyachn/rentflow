import { DashboardStatsSkeleton } from "@/features/analytics/dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardHomeLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <DashboardStatsSkeleton />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-64 xl:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
