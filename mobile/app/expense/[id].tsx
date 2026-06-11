import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  deleteExpense,
  fetchCategories,
  fetchExpenseById,
  signedReceiptUrl,
  updateExpense,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Category, Expense } from "@/types";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [exp, cats] = await Promise.all([
        fetchExpenseById(id),
        fetchCategories(),
      ]);
      setExpense(exp);
      setCategories(cats);
      if (exp) {
        setVendor(exp.vendor);
        setAmount(String(exp.amount));
        setDate(exp.date);
        setNotes(exp.description ?? "");
        setCategoryId(exp.category_id);
        if (exp.receipt?.image_path) {
          const url = await signedReceiptUrl(exp.receipt.image_path);
          setReceiptUrl(url);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!id) return;
    const amt = parseFloat(amount);
    if (!vendor.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert("Missing info", "Vendor and a positive amount are required.");
      return;
    }
    setSaving(true);
    try {
      await updateExpense(id, {
        vendor: vendor.trim(),
        amount: amt,
        date,
        description: notes.trim() || null,
        category_id: categoryId,
      });
      router.back();
    } catch (err: unknown) {
      Alert.alert(
        "Couldn't save",
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id) return;
    Alert.alert("Delete expense?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(id);
            router.back();
          } catch (err) {
            Alert.alert(
              "Couldn't delete",
              err instanceof Error ? err.message : "Something went wrong."
            );
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-surface-subtle items-center justify-center">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View className="flex-1 bg-surface-subtle items-center justify-center">
        <Text className="text-ink-muted">Expense not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface-subtle"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {receiptUrl ? (
          <Card className="mb-4 p-0 overflow-hidden">
            <Image
              source={{ uri: receiptUrl }}
              style={{ width: "100%", height: 240 }}
              contentFit="cover"
            />
          </Card>
        ) : null}

        <View className="gap-4">
          <Input label="Vendor" value={vendor} onChangeText={setVendor} />
          <Input
            label="Amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Input label="Date" value={date} onChangeText={setDate} />
          <CategoryPicker
            value={categoryId}
            onChange={setCategoryId}
            categories={categories}
          />
          <Input
            label="Notes"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {expense.items?.length ? (
            <Card>
              <Text className="text-base font-semibold text-ink mb-2">
                Items
              </Text>
              {expense.items.map((it, idx) => (
                <View
                  key={it.id}
                  className={`flex-row justify-between py-1.5 ${
                    idx === 0 ? "" : "border-t border-surface-border/60"
                  }`}
                >
                  <Text
                    className="text-sm text-ink flex-1"
                    numberOfLines={1}
                  >
                    {it.name}
                  </Text>
                  <Text className="text-sm text-ink-muted ml-2">
                    {formatCurrency(Number(it.total_price))}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}
        </View>

        <View className="mt-8 gap-3">
          <Button
            title="Save changes"
            size="lg"
            fullWidth
            loading={saving}
            onPress={save}
          />
          <Pressable
            onPress={remove}
            className="flex-row items-center justify-center py-3"
          >
            <Trash2 size={16} color="#dc2626" />
            <Text className="text-red-600 font-medium ml-2">Delete expense</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
