import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations/budget";
import type { BudgetStatus } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all budgets with category join
  const { data: budgets, error } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  // Fetch current month expenses
  const { data: expenses, error: expError } = await supabase
    .from("expenses")
    .select("amount, category_id")
    .eq("user_id", user.id)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  if (expError) {
    return NextResponse.json({ error: expError.message }, { status: 500 });
  }

  // Aggregate spending
  const totalSpent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const spentByCategory: Record<string, number> = {};
  for (const e of expenses ?? []) {
    if (e.category_id) {
      spentByCategory[e.category_id] = (spentByCategory[e.category_id] ?? 0) + Number(e.amount);
    }
  }

  // Build budget statuses
  const statuses: BudgetStatus[] = (budgets ?? []).map((budget) => {
    const spent = budget.category_id
      ? (spentByCategory[budget.category_id] ?? 0)
      : totalSpent;
    const remaining = Number(budget.amount) - spent;
    const percentage = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;

    let status: "ok" | "warning" | "exceeded" = "ok";
    if (percentage >= 100) status = "exceeded";
    else if (percentage >= 80) status = "warning";

    return { budget, spent, remaining, percentage, status };
  });

  return NextResponse.json(statuses);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validated = budgetSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 });
  }

  const { category_id, amount } = validated.data;
  const categoryValue = category_id || null;

  // Upsert: check if budget already exists for this scope
  let query;
  if (categoryValue) {
    query = supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("category_id", categoryValue)
      .maybeSingle();
  } else {
    query = supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .is("category_id", null)
      .maybeSingle();
  }

  const { data: existing } = await query;

  let data, error;
  if (existing) {
    // Update existing budget
    ({ data, error } = await supabase
      .from("budgets")
      .update({ amount })
      .eq("id", existing.id)
      .select("*, category:categories(*)")
      .single());
  } else {
    // Insert new budget
    ({ data, error } = await supabase
      .from("budgets")
      .insert({ user_id: user.id, category_id: categoryValue, amount })
      .select("*, category:categories(*)")
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: existing ? 200 : 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
