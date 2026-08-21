import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = {
    // Queue of counts — one per rate-limit query (IP check, then device check).
    counts: [0] as number[],
    error: null as { message: string } | null,
    inserted: [] as Record<string, unknown>[],
  };
  const headers = new Headers({ "x-forwarded-for": "203.0.113.7" });
  const gte = vi.fn(() =>
    Promise.resolve({
      count: state.counts.length > 1 ? state.counts.shift()! : (state.counts[0] ?? 0),
      error: state.error,
    }),
  );
  const eq = vi.fn(() => ({ eq: vi.fn(() => ({ gte })), gte }));
  const select = vi.fn(() => ({ eq }));
  const insert = vi.fn(async (row: Record<string, unknown>) => {
    state.inserted.push(row);
    return { error: null };
  });
  const from = vi.fn(() => ({ select, insert }));
  const upload = vi.fn(async () => ({ error: null }));
  return { state, headers, gte, eq, select, insert, from, upload };
});

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: mocks.from,
    auth: { getUser: vi.fn() },
    storage: {
      from: vi.fn(() => ({ upload: mocks.upload })),
    },
  },
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => ({ headers: mocks.headers }),
}));

import { GateError, storePhoto, verifyGate } from "@/lib/submissions.server";

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function expectedDeviceHash(secret: string, kind: string): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  return hmacSha256Hex("green-algeria", await sha256Hex(`${secret}:${kind}:${day}`));
}

describe("verifyGate", () => {
  beforeEach(() => {
    mocks.state.counts = [0];
    mocks.state.error = null;
    mocks.state.inserted = [];
    mocks.headers.set("x-forwarded-for", "203.0.113.7");
    mocks.headers.delete("cf-connecting-ip");
    mocks.headers.delete("x-real-ip");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("silently drops a filled honeypot without recording anything", async () => {
    await expect(verifyGate("planting", { hp: "i am a bot" })).resolves.toBe("dropped");
    expect(mocks.state.inserted).toHaveLength(0);
  });

  it("accepts an empty honeypot", async () => {
    await expect(verifyGate("planting", { hp: "" })).resolves.toBe("ok");
  });

  it("rejects a submission under 1200ms", async () => {
    await expect(verifyGate("planting", { elapsedMs: 1199 })).rejects.toBeInstanceOf(GateError);
  });

  it("rejects 0ms (no timing data faked)", async () => {
    await expect(verifyGate("planting", { elapsedMs: 0 })).rejects.toBeInstanceOf(GateError);
  });

  it("accepts exactly 1200ms", async () => {
    await expect(verifyGate("planting", { elapsedMs: 1200 })).resolves.toBe("ok");
  });

  it("skips timing when elapsedMs is absent or null", async () => {
    await expect(verifyGate("planting", {})).resolves.toBe("ok");
    await expect(verifyGate("planting", { elapsedMs: null })).resolves.toBe("ok");
  });

  it("rejects planting at the hourly limit (6)", async () => {
    mocks.state.counts = [6];
    await expect(verifyGate("planting", { elapsedMs: 5000 })).rejects.toBeInstanceOf(GateError);
  });

  it("accepts planting below the limit (5) and records the attempt", async () => {
    mocks.state.counts = [5];
    await expect(
      verifyGate("planting", { elapsedMs: 5000, deviceSecret: "secret-abc-123" }),
    ).resolves.toBe("ok");
    expect(mocks.state.inserted).toHaveLength(1);
    expect(mocks.state.inserted[0]?.["kind"]).toBe("planting");
    expect(mocks.state.inserted[0]?.["device_fingerprint"]).toBe(
      await expectedDeviceHash("secret-abc-123", "planting"),
    );
  });

  it("rejects at the device limit even when the IP is clean", async () => {
    // IP count 5 (ok), device count 6 (at the planting limit).
    mocks.state.counts = [5, 6];
    await expect(
      verifyGate("planting", { elapsedMs: 5000, deviceSecret: "secret-abc-123" }),
    ).rejects.toBeInstanceOf(GateError);
    expect(mocks.state.inserted).toHaveLength(0);
  });

  it("device hash differs by kind", async () => {
    const planting = await expectedDeviceHash("secret-abc-123", "planting");
    const fire = await expectedDeviceHash("secret-abc-123", "fire");
    expect(planting).not.toBe(fire);
  });

  it("rejects care at its limit (20) and accepts below", async () => {
    mocks.state.counts = [20];
    await expect(verifyGate("care", { elapsedMs: 5000 })).rejects.toBeInstanceOf(GateError);
    mocks.state.counts = [19];
    await expect(verifyGate("care", { elapsedMs: 5000 })).resolves.toBe("ok");
  });

  it("rejects fire at its limit (8) and accepts below", async () => {
    mocks.state.counts = [8];
    await expect(verifyGate("fire", { elapsedMs: 5000 })).rejects.toBeInstanceOf(GateError);
    mocks.state.counts = [7];
    await expect(verifyGate("fire", { elapsedMs: 5000 })).resolves.toBe("ok");
  });

  it("hashes ip with the green-algeria salt and records the hash", async () => {
    await verifyGate("planting", { elapsedMs: 5000 });
    const expected = await sha256Hex("green-algeria:203.0.113.7");
    expect(mocks.state.inserted[0]?.["ip_hash"]).toBe(expected);
  });

  it("falls back to cf-connecting-ip, then x-real-ip, then unknown", async () => {
    mocks.headers.delete("x-forwarded-for");
    mocks.headers.set("cf-connecting-ip", "198.51.100.9");
    await verifyGate("planting", { elapsedMs: 5000 });
    expect(mocks.state.inserted[0]?.["ip_hash"]).toBe(await sha256Hex("green-algeria:198.51.100.9"));

    mocks.headers.delete("cf-connecting-ip");
    mocks.headers.set("x-real-ip", "192.0.2.7");
    await verifyGate("planting", { elapsedMs: 5000 });
    expect(mocks.state.inserted[1]?.["ip_hash"]).toBe(await sha256Hex("green-algeria:192.0.2.7"));

    mocks.headers.delete("x-real-ip");
    await verifyGate("planting", { elapsedMs: 5000 });
    expect(mocks.state.inserted[2]?.["ip_hash"]).toBe(await sha256Hex("green-algeria:unknown"));
  });

  it("does not record a device hash when no secret is sent", async () => {
    await verifyGate("planting", { elapsedMs: 5000 });
    expect(mocks.state.inserted[0]?.["device_fingerprint"]).toBeNull();
  });

  it("fails open on a DB error but still records the attempt", async () => {
    mocks.state.error = { message: "connection refused" };
    await expect(verifyGate("planting", { elapsedMs: 5000 })).resolves.toBe("ok");
    expect(mocks.state.inserted).toHaveLength(1);
  });
});

describe("storePhoto", () => {
  const upload = mocks.upload;

  beforeEach(() => {
    upload.mockClear();
  });

  it("rejects an unsupported format", async () => {
    await expect(storePhoto("data:image/gif;base64,AAAA", "plantings")).rejects.toBeInstanceOf(
      GateError,
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects an oversized payload before decoding (no upload attempt)", async () => {
    // 900_000 bytes of base64 = exactly 1_200_000 chars; one more char pushes
    // the pre-decode estimate over the limit.
    const b64 = "A".repeat(1_200_002);
    await expect(storePhoto(`data:image/jpeg;base64,${b64}`, "plantings")).rejects.toBeInstanceOf(
      GateError,
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it("accepts a payload exactly at the limit and uploads it", async () => {
    const b64 = "A".repeat(1_200_000);
    const path = await storePhoto(`data:image/jpeg;base64,${b64}`, "plantings");
    expect(path).toMatch(/^plantings\/.+\.jpg$/);
    expect(upload).toHaveBeenCalledTimes(1);
  });
});
