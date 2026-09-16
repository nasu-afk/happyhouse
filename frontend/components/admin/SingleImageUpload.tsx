"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadToCloudinary, validateImageFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/upload";

export function SingleImageUpload({
  imageUrl,
  onChange,
}: {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setError(err); return; }

    setError("");
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      onChange(result.image_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (imageUrl) {
    return (
      <div className="relative w-full aspect-[16/9] rounded-card overflow-hidden border border-line group">
        <Image src={imageUrl} alt="" fill className="object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 bg-night/80 text-cream text-xs px-2.5 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`aspect-[16/9] border-2 border-dashed rounded-card flex flex-col items-center justify-center text-center px-4 cursor-pointer transition-colors ${
          dragOver ? "border-lake bg-lake/5" : "border-line hover:border-stone"
        }`}
      >
        {uploading ? (
          <p className="text-sm text-stone">Uploading…</p>
        ) : (
          <>
            <p className="text-sm text-ink font-medium">Drop a photo here or click to upload</p>
            <p className="text-xs text-stone mt-1">JPEG, PNG, or WebP — up to {MAX_IMAGE_SIZE_MB}MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
