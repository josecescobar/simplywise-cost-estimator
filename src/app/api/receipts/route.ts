import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { file_name, content_type } = await request.json();

  if (!file_name || !content_type) {
    return NextResponse.json(
      { error: "file_name and content_type are required" },
      { status: 400 }
    );
  }

  // Generate unique file path
  const ext = file_name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  // Create signed upload URL
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("receipts")
    .createSignedUploadUrl(path);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Create receipt record
  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      image_path: path,
      status: "pending",
    })
    .select()
    .single();

  if (receiptError) {
    return NextResponse.json({ error: receiptError.message }, { status: 500 });
  }

  return NextResponse.json({
    receipt,
    upload_url: uploadData.signedUrl,
    upload_token: uploadData.token,
    path,
  }, { status: 201 });
}
