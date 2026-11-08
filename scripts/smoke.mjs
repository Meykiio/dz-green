// Headless smoke test: key pages render, no page errors. Run against a
// running server (bun run build && node .output/server/index.mjs, or a
// deployed URL):  bun run smoke [baseUrl]
// Uses the installed Edge by default (SMOKE_BROWSER=chrome to switch), so
// no Playwright browser download is needed.
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: process.env["SMOKE_BROWSER"] ?? "msedge" });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`);
});

async function check(path, probe) {
  await page.goto(base + path, { waitUntil: "load" });
  await page.waitForTimeout(6000);
  console.log(path, JSON.stringify(await page.evaluate(probe)));
}

await check("/", () => ({
  canvas: !!document.querySelector(".maplibregl-canvas"),
  trees: document.querySelector("main")?.innerText.match(/(\d+)\s*\n?\s*(شجرة|trees|arbres)/)?.[1] ?? null,
}));
await check("/restore?w=6", () => {
  const panel = document.querySelector("#restore-panel-title")?.closest("section");
  return {
    rows: document.querySelectorAll("article ol li").length,
    panel: panel?.querySelector("h2")?.textContent ?? null,
    survivalBlockHidden: !/بعد سنة|after one year/.test(panel?.textContent ?? ""),
  };
});
await check("/check", () => ({
  comingSoon: document.querySelector("[role=status]")?.textContent ?? null,
  formShown: !!document.querySelector("form select"),
}));
await check("/plant", () => ({ form: !!document.querySelector("form"), season: !!document.querySelector("p svg") }));

console.log("errors:", errors.length ? errors : "none");
await browser.close();
