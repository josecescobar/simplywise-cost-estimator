import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { SpendingByCategory } from "@/types";

interface Props {
  data: SpendingByCategory[];
  currency: string;
}

export function CategoryBreakdown({ data, currency }: Props) {
  if (!data.length) {
    return (
      <Card>
        <Text className="text-base font-semibold text-ink">By category</Text>
        <Text className="text-sm text-ink-muted mt-2">
          No expenses yet this month. Scan a receipt to get started.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text className="text-base font-semibold text-ink mb-3">
        By category
      </Text>
      <View className="gap-3">
        {data.slice(0, 6).map((c) => (
          <View key={c.category_name}>
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: c.category_color }}
                />
                <Text
                  className="text-sm text-ink flex-1"
                  numberOfLines={1}
                >
                  {c.category_name}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-ink ml-2">
                {formatCurrency(c.total, currency)}
              </Text>
            </View>
            <View className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, c.percentage)}%`,
                  backgroundColor: c.category_color,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
