export const RECEIPT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REVIEW: "review",
} as const;

export type ReceiptStatus = (typeof RECEIPT_STATUS)[keyof typeof RECEIPT_STATUS];

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

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
