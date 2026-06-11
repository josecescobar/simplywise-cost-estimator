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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createCategory, deleteCategory, fetchCategories } from "@/lib/api";
import type { Category } from "@/types";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[6]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const cats = await fetchCategories();
    setCategories(cats);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: name.trim(), icon: "circle-dot", color });
      setName("");
      await load();
    } catch (err) {
      Alert.alert(
        "Couldn't add",
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    Alert.alert(
      "Delete category?",
      "Expenses in this category will become uncategorized.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(id);
              await load();
            } catch (err) {
              Alert.alert(
                "Couldn't delete",
                err instanceof Error ? err.message : "Something went wrong."
              );
            }
          },
        },
      ]
    );
  }

  const custom = categories.filter((c) => !c.is_default);
  const defaults = categories.filter((c) => c.is_default);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface-subtle"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card>
          <Text className="text-base font-semibold text-ink mb-3">
            Add category
          </Text>
          <Input
            label="Name"
            placeholder="e.g. Coffee"
            value={name}
            onChangeText={setName}
          />
          <Text className="text-sm font-medium text-ink mt-3 mb-2">Color</Text>
          <View className="flex-row flex-wrap gap-2">
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${
                  color === c ? "border-2 border-ink" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </View>
          <View className="mt-4">
            <Button
              title="Add"
              size="md"
              fullWidth
              loading={saving}
              onPress={add}
              leftIcon={<Plus size={16} color="#fff" />}
            />
          </View>
        </Card>

        {custom.length ? (
          <View className="mt-6">
            <Text className="text-base font-semibold text-ink mb-2">
              Custom
            </Text>
            <Card className="p-0 overflow-hidden">
              {custom.map((c, idx) => (
                <View key={c.id}>
                  <View className="flex-row items-center px-4 py-3">
                    <View
                      className="w-7 h-7 rounded-full mr-3"
                      style={{ backgroundColor: c.color }}
                    />
                    <Text className="flex-1 text-base text-ink">{c.name}</Text>
                    <Pressable onPress={() => remove(c.id)} className="p-2">
                      <Trash2 size={16} color="#9ca3af" />
                    </Pressable>
                  </View>
                  {idx < custom.length - 1 ? (
                    <View className="h-px bg-surface-border ml-14" />
                  ) : null}
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View className="mt-6">
          <Text className="text-base font-semibold text-ink mb-2">
            Defaults
          </Text>
          <Card className="p-0 overflow-hidden">
            {defaults.map((c, idx) => (
              <View key={c.id}>
                <View className="flex-row items-center px-4 py-3">
                  <View
                    className="w-7 h-7 rounded-full mr-3"
                    style={{ backgroundColor: c.color }}
                  />
                  <Text className="flex-1 text-base text-ink">{c.name}</Text>
                  <Text className="text-xs text-ink-muted">Built-in</Text>
                </View>
                {idx < defaults.length - 1 ? (
                  <View className="h-px bg-surface-border ml-14" />
                ) : null}
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
