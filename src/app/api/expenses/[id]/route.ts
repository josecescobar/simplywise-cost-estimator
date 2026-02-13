import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations/expense";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*, category:categories(*), receipt:receipts(*), items:expense_items(*), tags:expense_tags(tag:tags(*))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Flatten tags
  const expense = {
    ...data,
    tags: (data.tags as Array<{ tag: unknown }>)?.map((et) => et.tag).filter(Boolean) || [],
  };

  return NextResponse.json(expense);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Update expense
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .update(expenseData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (expenseError) {
    return NextResponse.json({ error: expenseError.message }, { status: 500 });
  }

  // Replace expense items
  await supabase.from("expense_items").delete().eq("expense_id", id);
  if (items && items.length > 0) {
    await supabase
      .from("expense_items")
      .insert(items.map((item) => ({ ...item, expense_id: id })));
  }

  // Replace expense tags
  await supabase.from("expense_tags").delete().eq("expense_id", id);
  if (tag_ids && tag_ids.length > 0) {
    await supabase
      .from("expense_tags")
      .insert(tag_ids.map((tag_id) => ({ expense_id: id, tag_id })));
  }

  return NextResponse.json(expense);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
