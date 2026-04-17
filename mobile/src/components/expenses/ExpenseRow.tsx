import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

interface Props {
  expense: Expense;
  currency: string;
}

export function ExpenseRow({ expense, currency }: Props) {
  const router = useRouter();
  const cat = expense.category;
  return (
    <Pressable
      onPress={() => router.push(`/expense/${expense.id}`)}
      className="flex-row items-center px-4 py-3 bg-white active:bg-surface-subtle"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: cat?.color ? `${cat.color}22` : "#f3f4f6" }}
      >
        <Text className="text-base font-semibold" style={{ color: cat?.color ?? "#6b7280" }}>
          {(cat?.name ?? expense.vendor).charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {expense.vendor}
        </Text>
        <Text className="text-xs text-ink-muted" numberOfLines={1}>
          {cat?.name ?? "Uncategorized"} · {formatDate(expense.date)}
        </Text>
      </View>
      <Text className="text-base font-semibold text-ink ml-2">
        {formatCurrency(Number(expense.amount), currency)}
      </Text>
    </Pressable>
  );
}
