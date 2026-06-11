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
import { createTag, deleteTag, fetchTags } from "@/lib/api";
import type { Tag } from "@/types";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default function TagsScreen() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[5]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setTags(await fetchTags());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createTag({ name: name.trim(), color });
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
    Alert.alert("Delete tag?", "This removes the tag from all expenses.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTag(id);
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
        <Card>
          <Text className="text-base font-semibold text-ink mb-3">Add tag</Text>
          <Input
            label="Name"
            placeholder="e.g. Business"
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

        <View className="mt-6">
          <Text className="text-base font-semibold text-ink mb-2">
            Your tags
          </Text>
          {tags.length === 0 ? (
            <Text className="text-sm text-ink-muted py-6 text-center">
              No tags yet.
            </Text>
          ) : (
            <Card className="p-0 overflow-hidden">
              {tags.map((t, idx) => (
                <View key={t.id}>
                  <View className="flex-row items-center px-4 py-3">
                    <View
                      className="px-2 py-1 rounded-full mr-2"
                      style={{ backgroundColor: `${t.color}22` }}
                    >
                      <Text className="text-xs font-medium" style={{ color: t.color }}>
                        #{t.name}
                      </Text>
                    </View>
                    <View className="flex-1" />
                    <Pressable onPress={() => remove(t.id)} className="p-2">
                      <Trash2 size={16} color="#9ca3af" />
                    </Pressable>
                  </View>
                  {idx < tags.length - 1 ? (
                    <View className="h-px bg-surface-border" />
                  ) : null}
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
