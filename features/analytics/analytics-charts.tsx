"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/utils";
import type { AgencyAnalytics } from "@/services/analytics";

// Single validated hue (passes light + dark; see the dataviz validator).
const HUE = "#2563EB";

const compact = new Intl.NumberFormat("en-US", { notation: "compact" });

// Shared tooltip theming — an HTML box, so CSS variables resolve and adapt to
// light/dark on their own.
const tooltipProps = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--popover-foreground)",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 500 },
  itemStyle: { color: "var(--popover-foreground)" },
} as const;

const tickStyle = { fontSize: 11, fill: "currentColor" } as const;

export function RevenueTrendChart({ data }: { data: AgencyAnalytics["revenueByMonth"] }) {
  return (
    <div className="text-muted-foreground h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HUE} stopOpacity={0.35} />
              <stop offset="100%" stopColor={HUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.14} vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={false} />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) => compact.format(Number(v))}
          />
          <Tooltip
            {...tooltipProps}
            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={HUE}
            strokeWidth={2}
            fill="url(#revFill)"
            dot={{ r: 3, fill: HUE, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal magnitude bars over a normalized { label, value } shape — used
 * for both sources (count) and top vehicles (revenue). */
function HBarChart({
  data,
  currency = false,
}: {
  data: { label: string; value: number }[];
  currency?: boolean;
}) {
  return (
    <div className="text-muted-foreground h-64 w-full [&_.recharts-label-list_text]:fill-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 44, left: 8, bottom: 4 }}
          barCategoryGap={10}
        >
          <CartesianGrid stroke="currentColor" strokeOpacity={0.14} horizontal={false} />
          <XAxis
            type="number"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => compact.format(Number(v))}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            {...tooltipProps}
            cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
            formatter={(value) => [
              currency ? formatCurrency(Number(value)) : String(value),
              currency ? "Revenue" : "Bookings",
            ]}
          />
          <Bar dataKey="value" fill={HUE} radius={[0, 4, 4, 0]} barSize={18}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => (currency ? formatCurrency(Number(v)) : String(v))}
              style={{ fontSize: 11, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BookingSourceChart({ data }: { data: AgencyAnalytics["bySource"] }) {
  return <HBarChart data={data.map((d) => ({ label: d.label, value: d.count }))} />;
}

export function TopVehiclesChart({ data }: { data: AgencyAnalytics["topVehicles"] }) {
  return <HBarChart data={data.map((d) => ({ label: d.label, value: d.revenue }))} currency />;
}

export function StatusBarChart({ data }: { data: AgencyAnalytics["byStatus"] }) {
  return (
    <div className="text-muted-foreground h-64 w-full [&_.recharts-label-list_text]:fill-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: 4, bottom: 0 }} barCategoryGap={16}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.14} vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={false} />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            {...tooltipProps}
            cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
            formatter={(value) => [String(value), "Bookings"]}
          />
          <Bar dataKey="count" fill={HUE} radius={[4, 4, 0, 0]} maxBarSize={56}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 500 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
