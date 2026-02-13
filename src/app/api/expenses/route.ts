import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations/expense";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category_id = searchParams.get("category_id");
  const search = searchParams.get("search");
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");
  const sort_by = searchParams.get("sort_by") || "date";
  const sort_order = searchParams.get("sort_order") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const per_page = parseInt(searchParams.get("per_page") || "20");

  let query = supabase
    .from("expenses")
    .select("*, category:categories(*), items:expense_items(*), tags:expense_tags(tag:tags(*))", { count: "exact" })
    .eq("user_id", user.id);

  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  if (search) {
    query = query.or(`vendor.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (date_from) {
    query = query.gte("date", date_from);
  }

  if (date_to) {
    query = query.lte("date", date_to);
  }

  const validSortColumns = ["date", "amount", "vendor", "created_at"];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : "date";

  query = query
    .order(sortColumn, { ascending: sort_order === "asc" })
    .range((page - 1) * per_page, page * per_page - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the nested tags structure
  const expenses = data?.map((expense: Record<string, unknown>) => ({
    ...expense,
    tags: (expense.tags as Array<{ tag: unknown }>)?.map((et) => et.tag).filter(Boolean) || [],
  }));

  return NextResponse.json({
    data: expenses,
    pagination: {
      page,
      per_page,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / per_page),
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validated = expenseSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 });
  }

  const { items, tag_ids, ...expenseData } = validated.data;

  // Create expense
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({ ...expenseData, user_id: user.id })
    .select()
    .single();

  if (expenseError) {
    return NextResponse.json({ error: expenseError.message }, { status: 500 });
  }

  // Create expense items
  if (items && items.length > 0) {
    const { error: itemsError } = await supabase
      .from("expense_items")
      .insert(items.map((item) => ({ ...item, expense_id: expense.id })));

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  // Create expense tags
  if (tag_ids && tag_ids.length > 0) {
    const { error: tagsError } = await supabase
      .from("expense_tags")
      .insert(tag_ids.map((tag_id) => ({ expense_id: expense.id, tag_id })));

    if (tagsError) {
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }
  }

  return NextResponse.json(expense, { status: 201 });
}
