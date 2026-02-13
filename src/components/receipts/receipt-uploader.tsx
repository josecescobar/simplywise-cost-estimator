"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, Camera, Loader2, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { toast } from "sonner";

export function ReceiptUploader() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic", ".heif"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // 1. Get signed upload URL
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: selectedFile.name,
          content_type: selectedFile.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to create upload URL");

      const { receipt, upload_url, upload_token } = await res.json();

      // 2. Upload directly to Supabase Storage
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");

      // 3. Trigger OCR processing
      toast.info("Processing receipt with AI...");
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

      // 4. Navigate to review page with OCR data
      const reviewData = encodeURIComponent(JSON.stringify({ ...ocrData, receipt_id: receipt.id }));
      router.push(`/scan?review=${reviewData}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <Card>
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">
                {isDragActive ? "Drop your receipt here" : "Upload a receipt"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop an image or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPEG, PNG, WebP, HEIC up to 10MB
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="relative w-32 h-40 rounded-md overflow-hidden bg-muted shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview || ""}
                  alt="Receipt preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearSelection} disabled={uploading}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleUpload} disabled={uploading} className="w-full">
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Scan Receipt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera capture for mobile */}
      <div className="sm:hidden">
        <label className="flex items-center justify-center gap-2 w-full border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors">
          <Camera className="h-5 w-5" />
          <span className="text-sm font-medium">Take Photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onDrop([file]);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
