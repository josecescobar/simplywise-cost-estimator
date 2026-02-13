export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  image_path: string;
  status: "pending" | "processing" | "completed" | "failed" | "review";
  raw_ocr_text: string | null;
  confidence: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  receipt_id: string | null;
  category_id: string | null;
  vendor: string;
  description: string | null;
  amount: number;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  date: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  receipt?: Receipt;
  tags?: Tag[];
  items?: ExpenseItem[];
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ExpenseTag {
  expense_id: string;
  tag_id: string;
}

export interface OCRResult {
  vendor: string;
  date: string;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  suggested_category: string;
  confidence: number;
  raw_text: string;
}

export interface DashboardStats {
  total_spent: number;
  total_expenses: number;
  avg_expense: number;
  top_category: string | null;
}

export interface SpendingByCategory {
  category_name: string;
  category_color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface SpendingByMonth {
  month: string;
  total: number;
  count: number;
}
