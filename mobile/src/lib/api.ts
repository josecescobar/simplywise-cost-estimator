import { supabase } from "./supabase";
import type {
  Budget,
  BudgetStatus,
  Category,
  Expense,
  OCRResult,
  Profile,
  Tag,
} from "@/types";

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not signed in");
  return user.id;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(input: {
  name: string;
  icon: string;
  color: string;
}) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...input, user_id, is_default: false })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Tag[];
}

export async function createTag(input: { name: string; color: string }) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("tags")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as Tag;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}

const expenseSelect = `
  *,
  category:categories(*),
  receipt:receipts(*),
  tags:expense_tags(tag:tags(*)),
  items:expense_items(*)
`;

type ExpenseTagRow = { tag: Tag };
type RawExpense = Omit<Expense, "tags"> & { tags?: ExpenseTagRow[] };

function normalizeExpense(raw: RawExpense): Expense {
  return {
    ...raw,
    tags: raw.tags?.map((t) => t.tag) ?? [],
  };
}

export async function fetchExpenses(opts?: {
  limit?: number;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<Expense[]> {
  let query = supabase
    .from("expenses")
    .select(expenseSelect)
    .order("date", { ascending: false });

  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts?.from) query = query.gte("date", opts.from);
  if (opts?.to) query = query.lte("date", opts.to);
  if (opts?.search) query = query.ilike("vendor", `%${opts.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => normalizeExpense(row as RawExpense));
}

export async function fetchExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select(expenseSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeExpense(data as RawExpense) : null;
}

type ExpenseInput = {
  vendor: string;
  description?: string | null;
  amount: number;
  subtotal?: number | null;
  tax?: number | null;
  tip?: number | null;
  date: string;
  category_id?: string | null;
  receipt_id?: string | null;
  tag_ids?: string[];
  items?: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
};

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const user_id = await currentUserId();
  const { tag_ids = [], items = [], ...core } = input;
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...core, user_id })
    .select()
    .single();
  if (error) throw error;
  const expense = data as Expense;

  if (tag_ids.length) {
    await supabase
      .from("expense_tags")
      .insert(tag_ids.map((tag_id) => ({ expense_id: expense.id, tag_id })));
  }
  if (items.length) {
    await supabase
      .from("expense_items")
      .insert(items.map((it) => ({ ...it, expense_id: expense.id })));
  }
  return expense;
}

export async function updateExpense(
  id: string,
  input: Partial<ExpenseInput>
): Promise<void> {
  const { tag_ids, items, ...core } = input;
  const { error } = await supabase
    .from("expenses")
    .update(core)
    .eq("id", id);
  if (error) throw error;

  if (tag_ids) {
    await supabase.from("expense_tags").delete().eq("expense_id", id);
    if (tag_ids.length) {
      await supabase
        .from("expense_tags")
        .insert(tag_ids.map((tag_id) => ({ expense_id: id, tag_id })));
    }
  }
  if (items) {
    await supabase.from("expense_items").delete().eq("expense_id", id);
    if (items.length) {
      await supabase
        .from("expense_items")
        .insert(items.map((it) => ({ ...it, expense_id: id })));
    }
  }
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*, category:categories(*)");
  if (error) throw error;
  return (data ?? []) as Budget[];
}

export async function fetchBudgetStatus(): Promise<BudgetStatus[]> {
  const budgets = await fetchBudgets();
  if (!budgets.length) return [];

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data: rows, error } = await supabase
    .from("expenses")
    .select("amount, category_id")
    .gte("date", firstOfMonth);
  if (error) throw error;

  const spentByCategory = new Map<string | null, number>();
  let overallSpent = 0;
  for (const row of rows ?? []) {
    overallSpent += Number(row.amount);
    const key = row.category_id as string | null;
    spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + Number(row.amount));
  }

  return budgets.map((b) => {
    const spent = b.category_id
      ? spentByCategory.get(b.category_id) ?? 0
      : overallSpent;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const status: BudgetStatus["status"] =
      pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : "ok";
    return {
      budget: b,
      spent,
      remaining: Math.max(0, b.amount - spent),
      percentage: pct,
      status,
    };
  });
}

export async function createBudget(input: {
  category_id: string | null;
  amount: number;
}) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("budgets")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}

export async function updateBudget(
  id: string,
  input: { amount?: number; category_id?: string | null }
) {
  const { error } = await supabase.from("budgets").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadReceiptImage(
  userId: string,
  uri: string,
  mimeType = "image/jpeg"
): Promise<{ path: string; publicUrl: string | null }> {
  const ext = mimeType.split("/")[1] ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  // RN FormData upload to supabase-js works, but using arrayBuffer is more
  // reliable for Expo — fetch the local file, convert to bytes, upload.
  const res = await fetch(uri);
  const blob = await res.blob();
  const bytes = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage
    .from("receipts")
    .upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return { path, publicUrl: data?.publicUrl ?? null };
}

export async function createReceiptRecord(imagePath: string) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("receipts")
    .insert({ image_path: imagePath, status: "processing", user_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReceiptRecord(
  id: string,
  patch: Partial<{
    status: string;
    raw_ocr_text: string | null;
    confidence: number | null;
    error_message: string | null;
  }>
) {
  const { error } = await supabase.from("receipts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function signedReceiptUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// OCR: Groq Llama 3.2 Vision. Mirrors the web app's extraction prompt so
// output shape stays in sync.
export async function extractReceipt(imageUrl: string): Promise<OCRResult> {
  const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!groqKey) throw new Error("Missing EXPO_PUBLIC_GROQ_API_KEY");

  const prompt = `You are a receipt OCR assistant. Extract the following JSON from the receipt image:
{
  "vendor": string,
  "date": "YYYY-MM-DD",
  "subtotal": number | null,
  "tax": number | null,
  "tip": number | null,
  "total": number,
  "items": [{"name": string, "quantity": number, "unit_price": number, "total_price": number}],
  "suggested_category": one of ["Groceries","Dining","Transportation","Shopping","Utilities","Healthcare","Entertainment","Travel","Education","Other"],
  "confidence": number between 0 and 1,
  "raw_text": string (concatenated text from the receipt)
}
Return ONLY valid JSON, no commentary.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OCR failed (${res.status}): ${body}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as OCRResult;
}
