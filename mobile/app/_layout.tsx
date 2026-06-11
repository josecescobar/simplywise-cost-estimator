import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="expense/[id]"
              options={{
                presentation: "card",
                headerShown: true,
                title: "Expense",
              }}
            />
            <Stack.Screen
              name="expense/new"
              options={{
                presentation: "modal",
                headerShown: true,
                title: "New expense",
              }}
            />
            <Stack.Screen
              name="budgets/index"
              options={{ headerShown: true, title: "Budgets" }}
            />
            <Stack.Screen
              name="categories"
              options={{ headerShown: true, title: "Categories" }}
            />
            <Stack.Screen
              name="tags"
              options={{ headerShown: true, title: "Tags" }}
            />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
