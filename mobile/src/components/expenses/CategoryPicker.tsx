import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import type { Category } from "@/types";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  categories: Category[];
  label?: string;
  allowNone?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  categories,
  label = "Category",
  allowNone = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

  return (
    <View>
      <Text className="text-sm font-medium text-ink mb-1.5">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-surface-border bg-white px-3 py-3"
      >
        <View className="flex-row items-center flex-1">
          {selected ? (
            <View
              className="w-6 h-6 rounded-full mr-2"
              style={{ backgroundColor: selected.color }}
            />
          ) : (
            <View className="w-6 h-6 rounded-full mr-2 bg-surface-muted" />
          )}
          <Text className="text-base text-ink">
            {selected?.name ?? "Uncategorized"}
          </Text>
        </View>
        <ChevronDown size={18} color="#6b7280" />
      </Pressable>

      <Modal visible={open} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setOpen(false)}
        >
          <View className="mt-auto bg-white rounded-t-3xl max-h-[70%] pb-6">
            <View className="w-10 h-1 bg-surface-border rounded-full self-center mt-3" />
            <Text className="text-lg font-semibold text-ink px-5 py-3">
              Choose category
            </Text>
            <FlatList
              data={
                allowNone
                  ? [{ id: null, name: "Uncategorized", color: "#9ca3af" }, ...categories]
                  : categories
              }
              keyExtractor={(item) =>
                item.id ?? "none"
              }
              renderItem={({ item }) => {
                const isSelected = (item.id ?? null) === value;
                return (
                  <Pressable
                    className="flex-row items-center px-5 py-3 active:bg-surface-subtle"
                    onPress={() => {
                      onChange(item.id ?? null);
                      setOpen(false);
                    }}
                  >
                    <View
                      className="w-8 h-8 rounded-full mr-3"
                      style={{ backgroundColor: item.color ?? "#9ca3af" }}
                    />
                    <Text className="text-base text-ink flex-1">
                      {item.name}
                    </Text>
                    {isSelected ? <Check size={18} color="#7c3aed" /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
