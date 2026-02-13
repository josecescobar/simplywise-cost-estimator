"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SpendingByMonth } from "@/lib/types";

interface SpendingChartProps {
  data: SpendingByMonth[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No spending data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="oklch(0.488 0.243 264.376)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
