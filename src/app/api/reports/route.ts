import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");

  // Get expenses with optional date filter
  let query = supabase
    .from("expenses")
    .select("*, category:categories(name, color, icon)")
    .eq("user_id", user.id);

  if (date_from) query = query.gte("date", date_from);
  if (date_to) query = query.lte("date", date_to);

  const { data: expenses, error } = await query.order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate stats
  const total_spent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const total_expenses = expenses?.length || 0;
  const avg_expense = total_expenses > 0 ? total_spent / total_expenses : 0;

  // Spending by category
  const categoryMap = new Map<string, { name: string; color: string; total: number; count: number }>();
  expenses?.forEach((e) => {
    const catName = (e.category as { name: string; color: string } | null)?.name || "Uncategorized";
    const catColor = (e.category as { name: string; color: string } | null)?.color || "#6b7280";
    const existing = categoryMap.get(catName) || { name: catName, color: catColor, total: 0, count: 0 };
    existing.total += Number(e.amount);
    existing.count += 1;
    categoryMap.set(catName, existing);
  });

  const by_category = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      percentage: total_spent > 0 ? (c.total / total_spent) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const top_category = by_category.length > 0 ? by_category[0].name : null;

  // Spending by month
  const monthMap = new Map<string, { month: string; total: number; count: number }>();
  expenses?.forEach((e) => {
    const month = e.date.substring(0, 7); // YYYY-MM
    const existing = monthMap.get(month) || { month, total: 0, count: 0 };
    existing.total += Number(e.amount);
    existing.count += 1;
    monthMap.set(month, existing);
  });

  const by_month = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // Top vendors
  const vendorMap = new Map<string, { vendor: string; total: number; count: number }>();
  expenses?.forEach((e) => {
    const existing = vendorMap.get(e.vendor) || { vendor: e.vendor, total: 0, count: 0 };
    existing.total += Number(e.amount);
    existing.count += 1;
    vendorMap.set(e.vendor, existing);
  });

  const top_vendors = Array.from(vendorMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Recent expenses (last 5)
  const recent = expenses?.slice(0, 5) || [];

  return NextResponse.json({
    stats: { total_spent, total_expenses, avg_expense, top_category },
    by_category,
    by_month,
    top_vendors,
    recent,
  });
}
