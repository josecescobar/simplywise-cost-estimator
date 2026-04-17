import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatMonth(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(new Date(date));
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const DEFAULT_CATEGORIES = [
  { name: "Groceries", icon: "shopping-cart", color: "#22c55e" },
  { name: "Dining", icon: "utensils", color: "#f97316" },
  { name: "Transportation", icon: "car", color: "#3b82f6" },
  { name: "Shopping", icon: "shopping-bag", color: "#a855f7" },
  { name: "Utilities", icon: "zap", color: "#eab308" },
  { name: "Healthcare", icon: "heart-pulse", color: "#ef4444" },
  { name: "Entertainment", icon: "tv", color: "#ec4899" },
  { name: "Travel", icon: "plane", color: "#06b6d4" },
  { name: "Education", icon: "graduation-cap", color: "#8b5cf6" },
  { name: "Other", icon: "circle-dot", color: "#6b7280" },
] as const;
