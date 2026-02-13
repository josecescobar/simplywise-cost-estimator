"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptUploader } from "@/components/receipts/receipt-uploader";
import { ReceiptReview } from "@/components/receipts/receipt-review";
import { Skeleton } from "@/components/ui/skeleton";

function ScanContent() {
  const searchParams = useSearchParams();
  const reviewData = searchParams.get("review");

  if (reviewData) {
    try {
      const ocrData = JSON.parse(decodeURIComponent(reviewData));
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Review Receipt</h1>
            <p className="text-muted-foreground">
              Verify the extracted data and make any corrections before saving.
            </p>
          </div>
          <ReceiptReview ocrData={ocrData} />
        </div>
      );
    } catch {
      // Invalid review data, show uploader
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Scan Receipt</h1>
        <p className="text-muted-foreground">
          Upload or photograph a receipt to automatically extract expense data.
        </p>
      </div>
      <ReceiptUploader />
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
      <ScanContent />
    </Suspense>
  );
}
