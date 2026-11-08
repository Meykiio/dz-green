import { describe, expect, it } from "vitest";

import { isAllowedPushEndpoint, shouldNotify } from "@/lib/push.server";
import { WILAYAS } from "@/lib/wilayas";

describe("shouldNotify", () => {
  it("null subscriber wilaya gets every fire (all of Algeria)", () => {
    expect(shouldNotify(null, "16")).toBe(true);
    expect(shouldNotify(null, "01")).toBe(true);
  });

  it("matching wilaya gets the fire, others don't", () => {
    expect(shouldNotify("16", "16")).toBe(true);
    expect(shouldNotify("16", "31")).toBe(false);
  });

  it("post-2019/2025 wilayas match their own code (69-polygon map)", () => {
    // mapCode is identity since the 69-polygon map; territory continuity for
    // moderators is handled at the DB level (assignments expanded to children).
    const child = WILAYAS.find((w) => Number(w.code) >= 49)!;
    expect(shouldNotify(child.code, child.code)).toBe(true);
    const other = WILAYAS.find((w) => w.code !== child.code)!;
    expect(shouldNotify(child.code, other.code)).toBe(false);
  });
});

describe("isAllowedPushEndpoint (SSRF guard)", () => {
  it("accepts the real browser push services", () => {
    for (const url of [
      "https://fcm.googleapis.com/fcm/send/abc:123",
      "https://updates.push.services.mozilla.com/wpush/v2/xyz",
      "https://web.push.apple.com/QGx",
      "https://wns2-par02p.notify.windows.com/w/?token=1",
    ]) {
      expect(isAllowedPushEndpoint(url), url).toBe(true);
    }
  });

  it("rejects anything else", () => {
    for (const url of [
      "http://fcm.googleapis.com/fcm/send/abc",
      "https://fcm.googleapis.com:8443/x",
      "https://evil.example.com/fcm.googleapis.com",
      "https://fcm.googleapis.com.evil.com/x",
      "https://169.254.169.254/latest/meta-data",
      "https://localhost/x",
      "not a url",
    ]) {
      expect(isAllowedPushEndpoint(url), url).toBe(false);
    }
  });
});
