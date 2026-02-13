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

  let query = supabase
    .from("expenses")
    .select("*, category:categories(name)")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (date_from) query = query.gte("date", date_from);
  if (date_to) query = query.lte("date", date_to);

  const { data: expenses, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build CSV
  const headers = ["Date", "Vendor", "Description", "Category", "Amount", "Subtotal", "Tax", "Tip", "Verified"];
  const rows = expenses?.map((e) => [
    e.date,
    `"${(e.vendor || "").replace(/"/g, '""')}"`,
    `"${(e.description || "").replace(/"/g, '""')}"`,
    (e.category as { name: string } | null)?.name || "Uncategorized",
    e.amount,
    e.subtotal || "",
    e.tax || "",
    e.tip || "",
    e.is_verified ? "Yes" : "No",
  ]);

  const csv = [headers.join(","), ...(rows?.map((r) => r.join(",")) || [])].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
