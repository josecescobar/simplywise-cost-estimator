import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { CategoryPicker } from "@/components/expenses/CategoryPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createExpense, fetchCategories } from "@/lib/api";
import type { Category } from "@/types";

export default function NewExpenseScreen() {
  const params = useLocalSearchParams<{
    receipt_id?: string;
    vendor?: string;
    date?: string;
    total?: string;
    subtotal?: string;
    tax?: string;
    tip?: string;
    suggested_category?: string;
    items?: string;
  }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendor, setVendor] = useState(params.vendor ?? "");
  const [amount, setAmount] = useState(params.total ?? "");
  const [subtotal, setSubtotal] = useState(params.subtotal ?? "");
  const [tax, setTax] = useState(params.tax ?? "");
  const [tip, setTip] = useState(params.tip ?? "");
  const [date, setDate] = useState(
    params.date ?? new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats);
      if (params.suggested_category) {
        const match = cats.find(
          (c) =>
            c.name.toLowerCase() === params.suggested_category?.toLowerCase()
        );
        if (match) setCategoryId(match.id);
      }
    });
  }, [params.suggested_category]);

  const items = useMemo(() => {
    if (!params.items) return [];
    try {
      return JSON.parse(params.items) as {
        name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }[];
    } catch {
      return [];
    }
  }, [params.items]);

  async function save() {
    const amt = parseFloat(amount);
    if (!vendor.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert(
        "Missing info",
        "Enter a vendor and a positive amount to save."
      );
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        vendor: vendor.trim(),
        description: notes.trim() || null,
        amount: amt,
        subtotal: subtotal ? parseFloat(subtotal) : null,
        tax: tax ? parseFloat(tax) : null,
        tip: tip ? parseFloat(tip) : null,
        date,
        category_id: categoryId,
        receipt_id: params.receipt_id ?? null,
        items: items.length ? items : undefined,
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface-subtle"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="gap-4">
          <Input
            label="Vendor"
            placeholder="Where did you spend?"
            value={vendor}
            onChangeText={setVendor}
          />
          <Input
            label="Amount"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Input
            label="Date"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />
          <CategoryPicker
            value={categoryId}
            onChange={setCategoryId}
            categories={categories}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Subtotal"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={subtotal}
                onChangeText={setSubtotal}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Tax"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={tax}
                onChangeText={setTax}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Tip"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={tip}
                onChangeText={setTip}
              />
            </View>
          </View>

          <Input
            label="Notes"
            placeholder="Optional notes"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {items.length ? (
            <View className="bg-white rounded-2xl border border-surface-border p-4">
              <Text className="text-sm font-medium text-ink mb-2">
                Items ({items.length})
              </Text>
              {items.map((it, idx) => (
                <View
                  key={idx}
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
                    {it.quantity} × ${it.unit_price.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View className="mt-8">
          <Button
            title="Save expense"
            size="lg"
            fullWidth
            loading={saving}
            onPress={save}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
