import { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, RefreshControl, Text, View } from "react-native";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { fetchExpenses, fetchProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types";

type MonthBucket = { label: string; total: number; key: string };

function bucketByMonth(expenses: Expense[]): MonthBucket[] {
  const map = new Map<string, { total: number; date: Date }>();
  for (const e of expenses) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) ?? { total: 0, date: d };
    existing.total += Number(e.amount);
    map.set(key, existing);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      label: v.date.toLocaleString("en-US", { month: "short" }),
      total: v.total,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6);
}

function CategoryDonut({
  data,
  size = 180,
}: {
  data: { color: string; total: number; name: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <Svg width={size} height={size}>
      <G rotation={-90} originX={cx} originY={cy}>
        <Circle cx={cx} cy={cy} r={r} stroke="#f3f4f6" strokeWidth={18} fill="none" />
        {data.map((d, i) => {
          if (total === 0) return null;
          const frac = d.total / total;
          const len = frac * c;
          const el = (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              stroke={d.color}
              strokeWidth={18}
              fill="none"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </G>
      <SvgText
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize={12}
        fill="#6b7280"
      >
        Total
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize={16}
        fontWeight="700"
        fill="#111827"
      >
        {formatCurrency(total)}
      </SvgText>
    </Svg>
  );
}

function MonthlyBars({
  data,
  width,
  currency,
}: {
  data: MonthBucket[];
  width: number;
  currency: string;
}) {
  const height = 180;
  const pad = 28;
  const max = Math.max(1, ...data.map((d) => d.total));
  const bw = data.length
    ? (width - pad * 2) / data.length - 8
    : 20;
  return (
    <Svg width={width} height={height}>
      <Line
        x1={pad}
        x2={width - pad}
        y1={height - pad}
        y2={height - pad}
        stroke="#e5e7eb"
      />
      {data.map((d, i) => {
        const h = (d.total / max) * (height - pad * 2);
        const x = pad + i * ((width - pad * 2) / data.length) + 4;
        const y = height - pad - h;
        return (
          <G key={d.key}>
            <Rect
              x={x}
              y={y}
              width={bw}
              height={h}
              rx={4}
              fill="#8b5cf6"
              opacity={0.9}
            />
            <SvgText
              x={x + bw / 2}
              y={height - pad + 14}
              fontSize={10}
              fill="#6b7280"
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
            <SvgText
              x={x + bw / 2}
              y={y - 4}
              fontSize={9}
              fill="#4b5563"
              textAnchor="middle"
            >
              {Math.round(d.total)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function ReportsScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [list, profile] = await Promise.all([
      fetchExpenses(),
      user ? fetchProfile(user.id) : Promise.resolve(null),
    ]);
    setExpenses(list);
    if (profile?.currency) setCurrency(profile.currency);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const monthly = useMemo(() => bucketByMonth(expenses), [expenses]);
  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number }>();
    for (const e of expenses) {
      const key = e.category?.id ?? "uncat";
      const name = e.category?.name ?? "Uncategorized";
      const color = e.category?.color ?? "#9ca3af";
      const cur = map.get(key) ?? { name, color, total: 0 };
      cur.total += Number(e.amount);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const width = Dimensions.get("window").width - 40;

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor="#7c3aed"
        />
      }
    >
      <View className="px-5 pt-3">
        <Text className="text-2xl font-bold text-ink">Reports</Text>
        <Text className="text-xs text-ink-muted mt-0.5">
          All-time insights across your expenses
        </Text>
      </View>

      <View className="px-5 mt-4">
        <Card>
          <Text className="text-base font-semibold text-ink mb-2">
            Monthly spend
          </Text>
          {monthly.length ? (
            <MonthlyBars data={monthly} width={width - 32} currency={currency} />
          ) : (
            <Text className="text-sm text-ink-muted py-8 text-center">
              Not enough data yet. Add a few expenses.
            </Text>
          )}
        </Card>
      </View>

      <View className="px-5 mt-4">
        <Card>
          <Text className="text-base font-semibold text-ink mb-3">
            Category mix
          </Text>
          <View className="items-center">
            <CategoryDonut data={byCategory} />
          </View>
          <View className="mt-4 gap-2">
            {byCategory.slice(0, 6).map((c) => (
              <View
                key={c.name}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: c.color }}
                  />
                  <Text className="text-sm text-ink">{c.name}</Text>
                </View>
                <Text className="text-sm font-semibold text-ink">
                  {formatCurrency(c.total, currency)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </Screen>
  );
}
