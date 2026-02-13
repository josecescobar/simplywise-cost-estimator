"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UploadState {
  uploading: boolean;
  processing: boolean;
  progress: "idle" | "uploading" | "processing" | "complete" | "error";
  error: string | null;
}

export function useReceiptUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    processing: false,
    progress: "idle",
    error: null,
  });

  const upload = useCallback(async (file: File) => {
    setState({ uploading: true, processing: false, progress: "uploading", error: null });

    try {
      // 1. Get signed upload URL
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to create upload URL");

      const { receipt, upload_url } = await res.json();

      // 2. Upload to Supabase Storage
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");

      // 3. Process with OCR
      setState((prev) => ({ ...prev, uploading: false, processing: true, progress: "processing" }));

      const ocrRes = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_id: receipt.id }),
      });

      if (!ocrRes.ok) {
        const error = await ocrRes.json();
        throw new Error(error.error || "OCR processing failed");
      }

      const ocrData = await ocrRes.json();
      setState({ uploading: false, processing: false, progress: "complete", error: null });

      return { receipt_id: receipt.id, ...ocrData };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setState({ uploading: false, processing: false, progress: "error", error: message });
      toast.error(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ uploading: false, processing: false, progress: "idle", error: null });
  }, []);

  return { ...state, upload, reset };
}
