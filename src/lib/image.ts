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

/**
 * Server-side sniff (audit 2026-08-28): verify a base64 data URL's magic
 * bytes match its declared type — the regex whitelist alone lets arbitrary
 * text through masked as an image (storage pollution; not XSS since the
 * proxy pins the content-type, but sloppy).
 */
export function sniffImageMime(dataUrl: string): "image/jpeg" | "image/png" | "image/webp" | null {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const header = dataUrl.slice(0, comma).toLowerCase();
  if (!/^data:image\/(jpeg|png|webp);base64$/.test(header)) return null;
  const declared = header.slice(5, header.indexOf(";")) as "image/jpeg" | "image/png" | "image/webp";
  let bytes: Buffer | Uint8Array;
  try {
    bytes = typeof Buffer !== "undefined"
      ? Buffer.from(dataUrl.slice(comma + 1), "base64")
      : Uint8Array.from(atob(dataUrl.slice(comma + 1)), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  if (bytes.length < 12) return null;

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (declared === "image/jpeg" && isJpeg) return declared;
  if (declared === "image/png" && isPng) return declared;
  if (declared === "image/webp" && isWebp) return declared;
  return null;
}