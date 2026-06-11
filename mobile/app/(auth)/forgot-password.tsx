import { Link, useRouter } from "expo-router";
import { Mail } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email) {
      Alert.alert("Missing email", "Enter the email for your account.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      Alert.alert(
        "Check your inbox",
        "If an account exists, we've sent a reset link to that address."
      );
      router.replace("/(auth)/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert("Couldn't send reset", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentClassName="px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center"
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-ink">
            Reset your password
          </Text>
          <Text className="text-base text-ink-muted mt-1">
            We&apos;ll email you a link to set a new password.
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          leftIcon={<Mail size={18} color="#6b7280" />}
        />

        <View className="mt-6">
          <Button
            title="Send reset link"
            size="lg"
            fullWidth
            loading={loading}
            onPress={onSubmit}
          />
        </View>

        <View className="flex-row justify-center mt-8">
          <Link href="/(auth)/login">
            <Text className="text-sm text-brand-600 font-semibold">
              Back to sign in
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
