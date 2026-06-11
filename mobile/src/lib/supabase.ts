import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// SecureStore has a 2 KB limit per entry on iOS; Supabase sessions can exceed
// that. Use AsyncStorage for session bytes and SecureStore only as a fallback
// on small payloads. AsyncStorage on iOS is not encrypted, but sessions are
// JWTs with short lifetimes (1h) and require the device already be unlocked —
// acceptable for v1. Swap to a chunked SecureStore adapter later if needed.
const storage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string) =>
          typeof window === "undefined"
            ? null
            : window.localStorage.getItem(key),
        setItem: async (key: string, value: string) => {
          if (typeof window !== "undefined")
            window.localStorage.setItem(key, value);
        },
        removeItem: async (key: string) => {
          if (typeof window !== "undefined")
            window.localStorage.removeItem(key);
        },
      }
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the session refreshed while the app is in the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export { SecureStore };
