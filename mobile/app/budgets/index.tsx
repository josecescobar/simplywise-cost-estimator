import { Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { CategoryPicker } from "@/components/expenses/CategoryPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  createBudget,
  deleteBudget,
  fetchBudgetStatus,
  fetchCategories,
  fetchProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import type { BudgetStatus, Category } from "@/types";

export default function BudgetsScreen() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const load = useCallback(async () => {
    const [b, cats, p] = await Promise.all([
      fetchBudgetStatus(),
      fetchCategories(),
      user ? fetchProfile(user.id) : Promise.resolve(null),
    ]);
    setBudgets(b);
    setCategories(cats);
    if (p?.currency) setCurrency(p.currency);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a positive budget amount.");
      return;
    }
    setSaving(true);
    try {
      await createBudget({ category_id: categoryId, amount: amt });
      setAmount("");
      setCategoryId(null);
      await load();
    } catch (err: unknown) {
      Alert.alert(
        "Couldn't save",
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    Alert.alert("Delete budget?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBudget(id);
          await load();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface-subtle"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-sm text-ink-muted mb-1">
          Monthly spending targets per category or overall.
        </Text>

        <Card className="mt-4">
          <Text className="text-base font-semibold text-ink mb-3">
            Add a budget
          </Text>
          <View className="gap-3">
            <CategoryPicker
              value={categoryId}
              onChange={setCategoryId}
              categories={categories}
              label="Category (leave blank for overall)"
            />
            <Input
              label="Monthly amount"
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
            />
            <Button
              title="Add budget"
              size="md"
              fullWidth
              loading={saving}
              onPress={add}
              leftIcon={<Plus size={16} color="#fff" />}
            />
          </View>
        </Card>

        <View className="mt-6">
          <Text className="text-base font-semibold text-ink mb-2">
            Your budgets
          </Text>
          {budgets.length === 0 ? (
            <Text className="text-sm text-ink-muted py-6 text-center">
              No budgets yet.
            </Text>
          ) : (
            <View className="gap-3">
              {budgets.map((b) => {
                const color =
                  b.status === "exceeded"
                    ? "#ef4444"
                    : b.status === "warning"
                    ? "#f59e0b"
                    : "#10b981";
                return (
                  <Card key={b.budget.id}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-ink">
                          {b.budget.category?.name ?? "Overall"}
                        </Text>
                        <Text className="text-xs text-ink-muted mt-0.5">
                          {formatCurrency(b.spent, currency)} of{" "}
                          {formatCurrency(b.budget.amount, currency)} ·{" "}
                          {formatCurrency(b.remaining, currency)} left
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => remove(b.budget.id)}
                        className="p-2"
                      >
                        <Trash2 size={16} color="#9ca3af" />
                      </Pressable>
                    </View>
                    <View className="mt-3 h-2 bg-surface-muted rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, b.percentage)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
