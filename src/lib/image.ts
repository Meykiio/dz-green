/**
 * Client-side photo compression: resize to <=1024px on the longest edge and
 * encode to WebP/JPEG under ~400KB, so uploads survive slow mobile networks.
 */
const MAX_EDGE = 1024;
const TARGET_BYTES = 400_000;

export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this photo.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const type = canvas.toDataURL("image/webp", 0.7).startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg";

  let quality = 0.78;
  let dataUrl = canvas.toDataURL(type, quality);
  while (approxBytes(dataUrl) > TARGET_BYTES && quality > 0.35) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL(type, quality);
  }
  return dataUrl;
}

function approxBytes(dataUrl: string): number {
  return Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
}