import { Link, useRouter } from "expo-router";
import { Lock, Mail, User } from "lucide-react-native";
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

export default function SignupScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit() {
    if (!fullName || !email || !password) {
      Alert.alert("Missing info", "Fill in all fields to create an account.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(email, password, fullName);
      if (needsConfirmation) {
        Alert.alert(
          "Check your email",
          "We sent a confirmation link. Open it to finish signing up."
        );
        router.replace("/(auth)/login");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert("Couldn't sign up", msg);
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
          <Text className="text-3xl font-bold text-ink">Create account</Text>
          <Text className="text-base text-ink-muted mt-1">
            Start tracking your expenses in seconds.
          </Text>
        </View>

        <View className="gap-3">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            autoCapitalize="words"
            autoComplete="name"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<User size={18} color="#6b7280" />}
          />
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
            placeholder="At least 6 characters"
            secureTextEntry
            autoComplete="password-new"
            value={password}
            onChangeText={setPassword}
            leftIcon={<Lock size={18} color="#6b7280" />}
          />
        </View>

        <View className="gap-3 mt-8">
          <Button
            title="Create account"
            size="lg"
            fullWidth
            loading={loading}
            onPress={onSubmit}
          />

          <View className="flex-row items-center my-2">
            <View className="flex-1 h-px bg-surface-border" />
            <Text className="mx-3 text-xs uppercase text-ink-muted">or</Text>
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
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login">
            <Text className="text-sm text-brand-600 font-semibold">
              Sign in
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
