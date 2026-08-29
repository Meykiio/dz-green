import { describe, expect, it } from "vitest";
import { sniffImageMime } from "@/lib/image";

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const JPEG =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==";
const WEBP = "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEALmk0mk0iIiIiIgBoSygABc6zbAAA";

function toDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}

describe("sniffImageMime", () => {
  it("accepts real PNG/JPEG/WebP declared as themselves", () => {
    expect(sniffImageMime(toDataUrl("image/png", PNG))).toBe("image/png");
    expect(sniffImageMime(toDataUrl("image/jpeg", JPEG))).toBe("image/jpeg");
    expect(sniffImageMime(toDataUrl("image/webp", WEBP))).toBe("image/webp");
  });

  it("rejects declared-type mismatch (PNG labeled JPEG)", () => {
    expect(sniffImageMime(toDataUrl("image/jpeg", PNG))).toBeNull();
  });

  it("rejects text masquerading as an image", () => {
    const fake = toDataUrl("image/jpeg", Buffer.from("<script>alert(1)</script>").toString("base64"));
    expect(sniffImageMime(fake)).toBeNull();
  });

  it("rejects garbage and short payloads", () => {
    expect(sniffImageMime("not-even-a-data-url")).toBeNull();
    expect(sniffImageMime(toDataUrl("image/png", "aaaa"))).toBeNull();
  });
});
