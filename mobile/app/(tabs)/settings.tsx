import { useRouter } from "expo-router";
import {
  ChevronRight,
  CircleUser,
  DollarSign,
  LogOut,
  Tag as TagIcon,
  Target,
  Layers,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { fetchProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type RowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

function Row({ icon, label, value, onPress, destructive }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 active:bg-surface-subtle"
    >
      <View className="w-8 items-center mr-3">{icon}</View>
      <Text
        className={`flex-1 text-base ${
          destructive ? "text-red-600" : "text-ink"
        }`}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-sm text-ink-muted mr-2">{value}</Text>
      ) : null}
      <ChevronRight size={16} color="#9ca3af" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");

  const load = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfileName(p?.full_name ?? null);
    if (p?.currency) setCurrency(p.currency);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  function confirmSignOut() {
    Alert.alert("Sign out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <Screen scrollable>
      <View className="px-5 pt-3">
        <Text className="text-2xl font-bold text-ink">Settings</Text>
      </View>

      <View className="px-5 mt-4">
        <Card className="p-0 overflow-hidden">
          <Row
            icon={<CircleUser size={18} color="#7c3aed" />}
            label={profileName ?? "Your profile"}
            value={user?.email ?? ""}
          />
          <View className="h-px bg-surface-border ml-14" />
          <Row
            icon={<DollarSign size={18} color="#7c3aed" />}
            label="Currency"
            value={currency}
          />
        </Card>
      </View>

      <View className="px-5 mt-4">
        <Card className="p-0 overflow-hidden">
          <Row
            icon={<Target size={18} color="#7c3aed" />}
            label="Budgets"
            onPress={() => router.push("/budgets")}
          />
          <View className="h-px bg-surface-border ml-14" />
          <Row
            icon={<Layers size={18} color="#7c3aed" />}
            label="Categories"
            onPress={() => router.push("/categories")}
          />
          <View className="h-px bg-surface-border ml-14" />
          <Row
            icon={<TagIcon size={18} color="#7c3aed" />}
            label="Tags"
            onPress={() => router.push("/tags")}
          />
        </Card>
      </View>

      <View className="px-5 mt-4">
        <Card className="p-0 overflow-hidden">
          <Row
            icon={<LogOut size={18} color="#dc2626" />}
            label="Sign out"
            destructive
            onPress={confirmSignOut}
          />
        </Card>
      </View>

      <View className="px-5 mt-6 items-center">
        <Text className="text-xs text-ink-muted">
          SimplyWise · v1.0.0
        </Text>
      </View>
    </Screen>
  );
}
