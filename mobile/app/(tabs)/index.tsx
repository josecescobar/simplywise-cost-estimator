import { useRouter } from "expo-router";
import {
  ChevronRight,
  DollarSign,
  Receipt as ReceiptIcon,
  Target,
  TrendingUp,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpenseRow } from "@/components/expenses/ExpenseRow";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/utils";

export default function HomeScreen() {
  const router = useRouter();
  const { profile, stats, recent, byCategory, budgets, loading, reload } =
    useDashboardData();
  const [refreshing, setRefreshing] = useState(false);
  const currency = profile?.currency ?? "USD";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
      }
    >
      <View className="px-5 pt-4 pb-2">
        <Text className="text-sm text-ink-muted">
          Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
        </Text>
        <Text className="text-2xl font-bold text-ink mt-1">
          This month so far
        </Text>
      </View>

      <View className="px-5 flex-row gap-3 mt-2">
        <StatCard
          label="Spent"
          value={formatCurrency(stats.total_spent, currency)}
          icon={DollarSign}
          sub={stats.top_category ? `Top: ${stats.top_category}` : undefined}
        />
        <StatCard
          label="Receipts"
          value={String(stats.total_expenses)}
          sub={
            stats.total_expenses
              ? `Avg ${formatCurrency(stats.avg_expense, currency)}`
              : "No expenses yet"
          }
          icon={ReceiptIcon}
        />
      </View>

      <View className="px-5 mt-4">
        <CategoryBreakdown data={byCategory} currency={currency} />
      </View>

      {budgets.length ? (
        <View className="px-5 mt-4">
          <Card>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-ink">Budgets</Text>
              <Pressable
                onPress={() => router.push("/budgets")}
                className="flex-row items-center"
              >
                <Text className="text-sm text-brand-600 mr-1">Manage</Text>
                <ChevronRight size={14} color="#7c3aed" />
              </Pressable>
            </View>
            <View className="gap-3">
              {budgets.map((b) => {
                const color =
                  b.status === "exceeded"
                    ? "#ef4444"
                    : b.status === "warning"
                    ? "#f59e0b"
                    : "#10b981";
                return (
                  <View key={b.budget.id}>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-ink">
                        {b.budget.category?.name ?? "Overall"}
                      </Text>
                      <Text className="text-sm font-semibold text-ink">
                        {formatCurrency(b.spent, currency)} /{" "}
                        {formatCurrency(b.budget.amount, currency)}
                      </Text>
                    </View>
                    <View className="h-2 bg-surface-muted rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, b.percentage)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      ) : (
        <View className="px-5 mt-4">
          <Pressable onPress={() => router.push("/budgets")}>
            <Card>
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-brand-100 rounded-full items-center justify-center mr-3">
                  <Target size={18} color="#7c3aed" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-ink">
                    Set a monthly budget
                  </Text>
                  <Text className="text-xs text-ink-muted mt-0.5">
                    Track spend against a target each month.
                  </Text>
                </View>
                <ChevronRight size={18} color="#9ca3af" />
              </View>
            </Card>
          </Pressable>
        </View>
      )}

      <View className="px-5 mt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-semibold text-ink">Recent</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/expenses")}
            className="flex-row items-center"
          >
            <Text className="text-sm text-brand-600 mr-1">See all</Text>
            <ChevronRight size={14} color="#7c3aed" />
          </Pressable>
        </View>
        {!loading && recent.length === 0 ? (
          <Card>
            <View className="items-center py-6">
              <TrendingUp size={28} color="#c4b5fd" />
              <Text className="text-sm text-ink-muted mt-2 text-center">
                No expenses yet. Scan a receipt to get started.
              </Text>
            </View>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            {recent.map((e, idx) => (
              <View key={e.id}>
                <ExpenseRow expense={e} currency={currency} />
                {idx < recent.length - 1 ? (
                  <View className="h-px bg-surface-border ml-16" />
                ) : null}
              </View>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}
