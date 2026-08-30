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
    <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* subtle top accent glow */}
      <span
        className={cn(
          "pointer-events-none absolute -top-16 end-[-3rem] size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          accent === "primary" && "bg-primary/20",
          accent === "accent" && "bg-accent/20",
          accent === "warning" && "bg-warning/20",
          accent === "destructive" && "bg-destructive/20",
        )}
      />
      <CardContent className="relative flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
          {typeof trend === "number" && (
            <p
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
                isPositive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}
              {trend}% {trendLabel}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
            accent === "primary" && "bg-gradient-to-br from-primary to-[var(--gold)] shadow-primary/20",
            accent === "accent" && "bg-gradient-to-br from-accent to-primary shadow-accent/20",
            accent === "warning" && "from-warning bg-gradient-to-br to-[var(--gold)] shadow-warning/20",
            accent === "destructive" &&
              "from-destructive bg-gradient-to-br to-[var(--gold)] shadow-destructive/20",
          )}
        >
          <Icon className="size-5" />
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
