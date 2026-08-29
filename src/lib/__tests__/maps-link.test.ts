import { describe, expect, it } from "vitest";
import { directionsUrl, isAllowedMapsHost, isIpLiteralHost, isShortMapsLink, parseGoogleMapsLink } from "@/lib/maps-link";

describe("parseGoogleMapsLink", () => {
  it.each([
    ["@ center", "https://www.google.com/maps/@36.7538,3.0588,15z", { lat: 36.7538, lng: 3.0588 }],
    ["place path", "https://www.google.com/maps/place/Some+Place/@35.6969,-0.6333,17z", { lat: 35.6969, lng: -0.6333 }],
    ["data segment", "https://www.google.com/maps/place/X/@36.7,3.05,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d36.7538!4d3.0588", { lat: 36.7538, lng: 3.0588 }],
    ["q param", "https://maps.google.com/?q=36.7538,3.0588", { lat: 36.7538, lng: 3.0588 }],
    ["query param", "https://www.google.com/maps/search/?api=1&query=36.7538%2C3.0588", { lat: 36.7538, lng: 3.0588 }],
    ["ll param", "https://www.google.com/maps?ll=36.7538,3.0588&z=15", { lat: 36.7538, lng: 3.0588 }],
    ["destination param", "https://www.google.com/maps/dir/?api=1&destination=36.7538,3.0588", { lat: 36.7538, lng: 3.0588 }],
    ["negative coords", "https://www.google.com/maps/@-33.86,151.21,12z", { lat: -33.86, lng: 151.21 }],
  ])("parses %s", (_label, url, expected) => {
    expect(parseGoogleMapsLink(url)).toEqual(expected);
  });

  it.each([
    ["empty", ""],
    ["not a url", "hello world"],
    ["no coords", "https://www.google.com/maps/place/Some+Place"],
    ["lat out of range", "https://www.google.com/maps/@95,3.0588,15z"],
    ["lng out of range", "https://www.google.com/maps/@36.75,190.5,15z"],
  ])("rejects %s", (_label, url) => {
    expect(parseGoogleMapsLink(url)).toBeNull();
  });
});

describe("isShortMapsLink", () => {
  it("detects short links (issue #38: goo.gl is dead, only maps.app.goo.gl resolves)", () => {
    expect(isShortMapsLink("https://goo.gl/maps/AbCdEf")).toBe(false);
    expect(isShortMapsLink("https://maps.app.goo.gl/AbCdEf")).toBe(true);
    expect(isShortMapsLink("https://www.google.com/maps/@36.75,3.05,15z")).toBe(false);
  });
});

describe("directionsUrl", () => {
  it("builds the official directions URL", () => {
    expect(directionsUrl(36.7538, 3.0588)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=36.7538,3.0588",
    );
  });
});

describe("isAllowedMapsHost (SSRF guard, audit 2026-08-28)", () => {
  it.each([
    "https://maps.app.goo.gl/abc",
    "https://maps.google.com/?q=36.7,3.0",
    "https://www.maps.google.com/?q=36.7,3.0",
    "https://www.google.com/maps/place/Algiers",
  ])("allows Google Maps hosts: %s", (url) => {
    expect(isAllowedMapsHost(url)).toBe(true);
  });

  it.each([
    "https://goo.gl/maps/abc",
    "http://goo.gl/maps/abc",
  ])("rejects dead goo.gl links (issue #38): %s", (url) => {
    expect(isAllowedMapsHost(url)).toBe(false);
  });

  it.each([
    "http://169.254.169.254/latest/meta-data/",
    "http://127.0.0.1/",
    "https://[::1]/",
    "https://evil.com/",
    "https://maps.google.com.evil.com/",
    "https://www.google.com/search?q=36.7,3",
    "ftp://www.google.com/maps",
    "https://localhost/dir",
  ])("rejects non-allowlisted targets: %s", (url) => {
    expect(isAllowedMapsHost(url)).toBe(false);
  });
});

describe("isIpLiteralHost", () => {
  it.each(["http://10.0.0.1/", "https://[2001:db8::1]/", "http://localhost/"])(
    "detects IP-literal hosts: %s",
    (url) => {
      expect(isIpLiteralHost(url)).toBe(true);
    },
  );
  it("ignores real hostnames", () => {
    expect(isIpLiteralHost("https://maps.google.com/maps")).toBe(false);
  });
});
