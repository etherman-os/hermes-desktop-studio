#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const [targetUrl, screenshotPath, ...flags] = process.argv.slice(2);
const disableJavaScript = flags.includes("--disable-js");

if (!targetUrl || !screenshotPath) {
  console.error("Usage: browser-evidence.mjs <target-url> <screenshot-path> [--disable-js]");
  process.exit(2);
}

function truncate(value, limit = 700) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
}

async function main() {
  await mkdir(dirname(screenshotPath), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    javaScriptEnabled: !disableJavaScript,
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (message) => {
    const type = message.type();
    if (!["error", "warning"].includes(type)) return;
    consoleMessages.push({ type, text: truncate(message.text()) });
  });
  page.on("pageerror", (error) => {
    pageErrors.push({ message: truncate(error?.message ?? error) });
  });

  let responseStatus = null;
  let navigationError = null;
  try {
    const response = await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 20000 });
    responseStatus = response?.status() ?? null;
  } catch (error) {
    navigationError = truncate(error?.message ?? error, 1000);
    if (page.url() === "about:blank") {
      const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
      responseStatus = response?.status() ?? null;
    }
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(350);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const checks = await page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    const unnamedActions = [...document.querySelectorAll("button, a, [role='button']")]
      .filter((element) => {
        const name = [
          element.textContent,
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          element.getAttribute("alt"),
        ].join(" ").replace(/\s+/g, " ").trim();
        return !name;
      });
    const imagesMissingAlt = [...document.querySelectorAll("img")]
      .filter((element) => !element.getAttribute("alt"));
    const focusables = document.querySelectorAll(
      "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    const html = document.documentElement;
    return {
      body_text_length: text.trim().length,
      heading_count: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
      unnamed_action_count: unnamedActions.length,
      images_missing_alt_count: imagesMissingAlt.length,
      focusable_count: focusables.length,
      horizontal_overflow: html.scrollWidth > window.innerWidth + 2,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { width: html.scrollWidth, height: html.scrollHeight },
    };
  });

  const output = {
    target_url: targetUrl,
    final_url: page.url(),
    title: await page.title(),
    response_status: responseStatus,
    screenshot_path: screenshotPath,
    java_script_enabled: !disableJavaScript,
    navigation_error: navigationError,
    console_messages: consoleMessages.slice(0, 30),
    page_errors: pageErrors.slice(0, 30),
    checks,
  };

  await browser.close();
  console.log(JSON.stringify(output));
}

main().catch((error) => {
  console.error(error?.stack ?? error?.message ?? String(error));
  process.exit(1);
});
