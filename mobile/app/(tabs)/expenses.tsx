import { useRouter } from "expo-router";
import { Plus, Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { ExpenseRow } from "@/components/expenses/ExpenseRow";
import { Screen } from "@/components/ui/Screen";
import { fetchCategories, fetchExpenses, fetchProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Category, Expense } from "@/types";

export default function ExpensesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const [list, cats, profile] = await Promise.all([
          fetchExpenses({
            categoryId: categoryId ?? undefined,
            search: search || undefined,
          }),
          categories.length ? Promise.resolve(categories) : fetchCategories(),
          user ? fetchProfile(user.id) : Promise.resolve(null),
        ]);
        setExpenses(list);
        if (!categories.length) setCategories(cats);
        if (profile?.currency) setCurrency(profile.currency);
      } finally {
        setLoading(false);
      }
    },
    [categoryId, search, categories.length, user]
  );

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  return (
    <Screen edges={["top", "left", "right"]}>
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-ink">Expenses</Text>
          <Text className="text-xs text-ink-muted mt-0.5">
            {expenses.length} items ·{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(total)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/expense/new")}
          className="w-10 h-10 bg-brand-600 rounded-full items-center justify-center active:bg-brand-700"
        >
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      <View className="px-5 mt-2">
        <View className="flex-row items-center rounded-xl border border-surface-border bg-white px-3">
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => load({ silent: true })}
            placeholder="Search vendor"
            placeholderTextColor="#9ca3af"
            className="flex-1 py-2.5 ml-2 text-base text-ink"
            returnKeyType="search"
          />
        </View>
      </View>

      <View className="mt-3 pl-5">
        <FlatList
          horizontal
          data={[{ id: null, name: "All" } as Category | { id: null; name: string }, ...categories]}
          keyExtractor={(item) => item.id ?? "all"}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="w-2" />}
          contentContainerStyle={{ paddingRight: 20 }}
          renderItem={({ item }) => {
            const active = (item.id ?? null) === categoryId;
            return (
              <Pressable
                onPress={() => setCategoryId(item.id ?? null)}
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? "bg-brand-600 border-brand-600"
                    : "bg-white border-surface-border"
                }`}
              >
                <Text
                  className={`text-sm ${
                    active ? "text-white" : "text-ink"
                  }`}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        className="mt-2"
        data={expenses}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <ExpenseRow expense={item} currency={currency} />
        )}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-surface-border ml-16" />
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center p-10">
              <Text className="text-ink-muted text-sm text-center">
                No expenses match your filters yet.
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load({ silent: true });
              setRefreshing(false);
            }}
            tintColor="#7c3aed"
          />
        }
      />
    </Screen>
  );
}
