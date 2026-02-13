import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractReceiptData } from "@/lib/ai/receipt-extraction";
import sharp from "sharp";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receipt_id } = await request.json();

  if (!receipt_id) {
    return NextResponse.json({ error: "receipt_id is required" }, { status: 400 });
  }

  // Get receipt record
  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", receipt_id)
    .eq("user_id", user.id)
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  // Update status to processing
  await supabase
    .from("receipts")
    .update({ status: "processing" })
    .eq("id", receipt_id);

  try {
    // Download image from storage using admin client to bypass RLS
    const adminClient = createAdminClient();
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("receipts")
      .download(receipt.image_path);

    if (downloadError || !fileData) {
      throw new Error("Failed to download image: " + downloadError?.message);
    }

    // Convert to buffer and resize with sharp
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const resized = await sharp(buffer)
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Convert to base64
    const base64 = resized.toString("base64");

    // Extract data with OpenAI Vision
    const result = await extractReceiptData(base64, "image/jpeg");

    // Update receipt with OCR results
    await supabase
      .from("receipts")
      .update({
        status: "review",
        raw_ocr_text: result.raw_text,
        confidence: result.confidence,
      })
      .eq("id", receipt_id);

    return NextResponse.json(result);
  } catch (error) {
    // Update status to failed
    await supabase
      .from("receipts")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "OCR processing failed",
      })
      .eq("id", receipt_id);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OCR processing failed" },
      { status: 500 }
    );
  }
}
