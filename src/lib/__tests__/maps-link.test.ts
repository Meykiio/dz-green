import { describe, expect, it } from "vitest";
import { directionsUrl, isShortMapsLink, parseGoogleMapsLink } from "@/lib/maps-link";

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
  it("detects short links", () => {
    expect(isShortMapsLink("https://goo.gl/maps/AbCdEf")).toBe(true);
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
