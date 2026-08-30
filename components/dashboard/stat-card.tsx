import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  accent?: "primary" | "accent" | "warning" | "destructive";
}) {
  const isPositive = typeof trend === "number" && trend >= 0;

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
          {typeof trend === "number" && (
            <p
              className={cn(
                "text-xs font-medium",
                isPositive ? "text-success" : "text-destructive",
              )}
            >
              {isPositive ? "+" : ""}
              {trend}% {trendLabel}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            accent === "primary" && "bg-primary/10 text-primary",
            accent === "accent" && "bg-accent/10 text-accent",
            accent === "warning" && "bg-warning/15 text-warning-foreground",
            accent === "destructive" && "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="w-full space-y-2.5">
          <div className="bg-muted h-3.5 w-20 animate-pulse rounded" />
          <div className="bg-muted h-7 w-16 animate-pulse rounded" />
          <div className="bg-muted h-3 w-24 animate-pulse rounded" />
        </div>
        <div className="bg-muted size-9 shrink-0 animate-pulse rounded-lg" />
      </CardContent>
    </Card>
  );
}
