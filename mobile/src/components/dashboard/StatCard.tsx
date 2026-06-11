import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tint?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tint = "#ede9fe",
}: StatCardProps) {
  return (
    <Card className="flex-1">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </Text>
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: tint }}
        >
          <Icon size={16} color="#7c3aed" />
        </View>
      </View>
      <Text className="text-2xl font-bold text-ink">{value}</Text>
      {sub ? (
        <Text className="text-xs text-ink-muted mt-1">{sub}</Text>
      ) : null}
    </Card>
  );
}
