import OpenAI from "openai";
import type { OCRResult } from "@/lib/types";

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const EXTRACTION_PROMPT = `You are a receipt data extraction assistant. Analyze this receipt image and extract the following information in JSON format:

{
  "vendor": "Store/restaurant name",
  "date": "YYYY-MM-DD format",
  "subtotal": number or null,
  "tax": number or null,
  "tip": number or null,
  "total": number (the final total amount),
  "items": [
    {
      "name": "Item description",
      "quantity": number,
      "unit_price": number,
      "total_price": number
    }
  ],
  "suggested_category": "One of: Groceries, Dining, Transportation, Shopping, Utilities, Healthcare, Entertainment, Travel, Education, Other",
  "confidence": number between 0 and 1 indicating how confident you are in the extraction
}

Rules:
- If you can't determine a field, use null
- All monetary values should be numbers (not strings)
- Date must be in YYYY-MM-DD format. If year is unclear, use the current year
- For items, extract as many line items as visible
- quantity defaults to 1 if not specified
- confidence should reflect how clearly the receipt is readable
- suggested_category should be your best guess based on the vendor name and items

Return ONLY the JSON object, no other text.`;

export async function extractReceiptData(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<OCRResult> {
  const response = await getClient().chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content || "";

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  return {
    vendor: parsed.vendor || "Unknown",
    date: parsed.date || new Date().toISOString().split("T")[0],
    subtotal: parsed.subtotal,
    tax: parsed.tax,
    tip: parsed.tip,
    total: parsed.total || 0,
    items: (parsed.items || []).map((item: Record<string, unknown>) => ({
      name: String(item.name || ""),
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
    })),
    suggested_category: parsed.suggested_category || "Other",
    confidence: parsed.confidence || 0.5,
    raw_text: content,
  };
}
