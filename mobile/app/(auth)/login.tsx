import { Link, useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
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

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter your email and password to sign in.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert("Couldn't sign in", msg);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      Alert.alert("Google sign-in failed", msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Screen contentClassName="px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center"
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-ink">Welcome back</Text>
          <Text className="text-base text-ink-muted mt-1">
            Sign in to SimplyWise to keep tracking.
          </Text>
        </View>

        <View className="gap-3">
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
          <Input
            label="Password"
            placeholder="Your password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            leftIcon={<Lock size={18} color="#6b7280" />}
          />
          <Link href="/(auth)/forgot-password" asChild>
            <Text className="text-sm text-brand-600 self-end mt-1">
              Forgot password?
            </Text>
          </Link>
        </View>

        <View className="gap-3 mt-8">
          <Button
            title="Sign in"
            size="lg"
            fullWidth
            loading={loading}
            onPress={onSubmit}
          />

          <View className="flex-row items-center my-2">
            <View className="flex-1 h-px bg-surface-border" />
            <Text className="mx-3 text-xs uppercase text-ink-muted">
              or
            </Text>
            <View className="flex-1 h-px bg-surface-border" />
          </View>

          <Button
            title="Continue with Google"
            variant="outline"
            size="lg"
            fullWidth
            loading={googleLoading}
            onPress={onGoogle}
          />
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
          </Text>
          <Link href="/(auth)/signup">
            <Text className="text-sm text-brand-600 font-semibold">
              Sign up
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
