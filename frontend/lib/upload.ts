import { api } from "@/lib/api";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_MB = 8;

export async function uploadToCloudinary(file: File): Promise<{ image_url: string; public_id: string }> {
  const sig = await api.admin.uploads.getSignature();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.api_key);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || "Upload to image storage failed");
  }
  const data = await res.json();
  return { image_url: data.secure_url, public_id: data.public_id };
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, or WebP images are allowed.`;
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `${file.name}: file is larger than ${MAX_IMAGE_SIZE_MB}MB.`;
  }
  return null;
}
