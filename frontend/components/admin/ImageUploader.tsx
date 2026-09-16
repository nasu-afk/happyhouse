"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { uploadToCloudinary, validateImageFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/upload";

export interface UploaderImage {
  id?: number; // present once persisted to the DB (edit mode)
  image_url: string;
  public_id?: string;
  display_order: number;
  is_primary: boolean;
}

export function ImageUploader({
  images,
  onChange,
  propertyId,
}: {
  images: UploaderImage[];
  onChange: (images: UploaderImage[]) => void;
  propertyId?: number;
}) {
  const [uploading, setUploading] = useState(0); // count of in-flight uploads
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");

    const valid: File[] = [];
    for (const file of Array.from(files)) {
      const err = validateImageFile(file);
      if (err) {
        setError(err);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    setUploading((n) => n + valid.length);
    const results = await Promise.allSettled(valid.map(uploadToCloudinary));
    setUploading((n) => n - valid.length);

    const newImages: UploaderImage[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        newImages.push({
          image_url: result.value.image_url,
          public_id: result.value.public_id,
          display_order: images.length + newImages.length,
          is_primary: images.length === 0 && newImages.length === 0,
        });
      } else {
        setError((prev) => prev || result.reason?.message || "One or more uploads failed.");
      }
    }
    if (newImages.length === 0) return;

    if (propertyId) {
      // Edit mode — persist each image immediately.
      const persisted: UploaderImage[] = [];
      for (const img of newImages) {
        try {
          const saved = await api.admin.properties.addImage(propertyId, img);
          persisted.push(saved);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to save image");
        }
      }
      onChange([...images, ...persisted]);
    } else {
      // Create mode — just accumulate in local state; parent submits with the form.
      onChange([...images, ...newImages]);
    }
  }

  async function handleRemove(img: UploaderImage, index: number) {
    if (propertyId && img.id) {
      try {
        await api.admin.properties.removeImage(propertyId, img.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove image");
        return;
      }
    }
    const next = images.filter((_, i) => i !== index);
    // If we removed the primary image, promote the new first image.
    if (img.is_primary && next.length > 0) next[0] = { ...next[0], is_primary: true };
    onChange(next);
  }

  async function handleSetPrimary(img: UploaderImage, index: number) {
    if (propertyId && img.id) {
      try {
        await api.admin.properties.setPrimaryImage(propertyId, img.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set primary image");
        return;
      }
    }
    onChange(images.map((im, i) => ({ ...im, is_primary: i === index })));
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((im, i) => ({ ...im, display_order: i })));
    // Reordering after creation is cosmetic-only for now — display_order
    // persistence on existing properties isn't wired to this control yet.
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-lake bg-lake/5" : "border-line hover:border-stone"
        }`}
      >
        <p className="text-ink font-medium">Drop images here or click to upload</p>
        <p className="text-sm text-stone mt-1">JPEG, PNG, or WebP — up to {MAX_IMAGE_SIZE_MB}MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {uploading > 0 && (
        <p className="text-sm text-stone mt-3">Uploading {uploading} {uploading === 1 ? "image" : "images"}…</p>
      )}
      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
          {images.map((img, i) => (
            <div key={img.id ?? img.image_url} className="relative group border border-line rounded-card overflow-hidden">
              <div className="relative aspect-square bg-line">
                <Image src={img.image_url} alt="" fill className="object-cover" />
              </div>

              {img.is_primary && (
                <span className="absolute top-1.5 left-1.5 bg-lake text-paper text-xs px-2 py-0.5 rounded-sm">
                  Primary
                </span>
              )}

              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/60 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img, i)}
                    title="Make primary"
                    className="bg-paper text-ink text-xs px-2 py-1 rounded-sm"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0}
                  title="Move left"
                  className="bg-paper text-ink text-xs w-6 h-6 rounded-sm disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(i, 1)}
                  disabled={i === images.length - 1}
                  title="Move right"
                  className="bg-paper text-ink text-xs w-6 h-6 rounded-sm disabled:opacity-40"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(img, i)}
                  title="Remove"
                  className="bg-red-700 text-paper text-xs w-6 h-6 rounded-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
