import { chromium } from "playwright";

import {
  findVisibleWakeButton,
  normalizeAppUrl,
  summarizeFrameUrls,
  waitForReadyPage,
} from "./streamlit_keep_alive_helpers.mjs";

const rawAppUrl = process.env.STREAMLIT_APP_URL || "";
const appUrl = normalizeAppUrl(rawAppUrl);

if (!appUrl) {
  console.error("Set STREAMLIT_APP_URL before running the keep-alive script.");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1200 },
});

page.setDefaultTimeout(120000);

try {
  let success = false;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    console.log(`Opening ${appUrl} (attempt ${attempt}/3)`);

    if (attempt === 1) {
      await page.goto(appUrl, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
    } else {
      await page.reload({
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
    }

    await page.waitForTimeout(5000);

    const wakeButton = await findVisibleWakeButton(page);
    if (wakeButton) {
      console.log("Sleeping-page wake button detected; clicking it.");
      await wakeButton.click();
      await page.waitForTimeout(8000);
    }

    try {
      const readySignal = await waitForReadyPage(page, appUrl, 45000);
      const title = await page.title();
      console.log(
        `Browser visit succeeded: ${title || "Untitled page"} (${readySignal})`,
      );
      success = true;
      break;
    } catch (error) {
      console.log(`Frame URLs seen: ${summarizeFrameUrls(page, appUrl)}`);
      if (attempt === 3) {
        throw error;
      }
      console.log("Dashboard did not finish loading yet; retrying.");
    }
  }

  if (!success) {
    throw new Error("Dashboard visit did not succeed after 3 attempts.");
  }
} catch (error) {
  await page.screenshot({ path: "streamlit-keep-alive-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
