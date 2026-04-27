export const APP_TITLE_MARKERS = ["Summa Virtutum"];

export const LANDING_MARKERS = [
  "Summa Virtutum",
  "An interactive map of Thomas Aquinas’s moral corpus",
  "An interactive map of Thomas Aquinas's moral corpus",
];

export const WAKE_BUTTON_NAME = /yes,\s*get this app back up!?/i;

export function normalizeAppUrl(rawAppUrl = "") {
  return String(rawAppUrl || "").replace(/\/+$/, "");
}

export function titleLooksReady(title = "") {
  return APP_TITLE_MARKERS.some((marker) => title.includes(marker));
}

export function textHasLandingMarker(text = "") {
  return LANDING_MARKERS.some((marker) => text.includes(marker));
}

export function isAppFrameUrl(frameUrl = "", appUrl = "") {
  const normalizedAppUrl = normalizeAppUrl(appUrl);
  const normalizedFrameUrl = normalizeAppUrl(frameUrl);
  if (!normalizedAppUrl || !normalizedFrameUrl) {
    return false;
  }
  return (
    normalizedFrameUrl === normalizedAppUrl ||
    normalizedFrameUrl.startsWith(`${normalizedAppUrl}/~/+`)
  );
}

export function summarizeFrameUrls(page, appUrl) {
  return page
    .frames()
    .map((frame) => {
      const url = frame.url();
      return isAppFrameUrl(url, appUrl) ? `[app] ${url}` : url;
    })
    .join(" | ");
}

export async function findVisibleWakeButton(page) {
  for (const frame of page.frames()) {
    const wakeButton = frame.getByRole("button", { name: WAKE_BUTTON_NAME });
    if (await wakeButton.isVisible().catch(() => false)) {
      return wakeButton;
    }
  }
  return null;
}

export async function readySignalForPage(page, appUrl) {
  const title = await page.title().catch(() => "");
  if (titleLooksReady(title)) {
    return `title:${title}`;
  }

  for (const frame of page.frames()) {
    if (!isAppFrameUrl(frame.url(), appUrl)) {
      continue;
    }
    const text = await frame
      .locator("body")
      .innerText({ timeout: 3000 })
      .catch(() => "");
    if (textHasLandingMarker(text)) {
      return `frame:${frame.url()}`;
    }
  }

  return null;
}

export async function waitForReadyPage(page, appUrl, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const signal = await readySignalForPage(page, appUrl);
    if (signal) {
      return signal;
    }
    await page.waitForTimeout(1000);
  }

  throw new Error("Dashboard did not expose a ready title or app-frame landing marker in time.");
}
