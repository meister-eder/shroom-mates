import { expect, test } from "@playwright/test";
import { MOCK, routes, WEB } from "../visual/routes";

/**
 * Datenschutz-Wächter: Die Seite bleibt bannerfrei, solange nichts Nicht-
 * Notwendiges im Browser gespeichert oder von Dritten geladen wird.
 * § 25 Abs. 2 Nr. 2 TDDDG (technisch erforderlich für einen ausdrücklich
 * gewünschten Dienst): https://www.gesetze-im-internet.de/ttdsg/__25.html
 * Erlaubnislisten nur nach rechtlicher Prüfung erweitern, nicht um den Test grün zu bekommen.
 */
// "umami.disabled": Opt-out der Statistik auf /datenschutz/. Den Schlüssel setzt nur der Besucher
// selbst per Klick (nutzerinitiiert, nicht einwilligungsrelevant); ohne Klick bleibt er leer.
const ALLOWED_STORAGE_KEYS = [
  "cart_id",
  "checkout_cart_id",
  "cart_snapshot",
  "umami.disabled",
];
// Die Karte hat keinen gespeicherten Einwilligungsschlüssel (Klick lädt nur für diese Ansicht).
const ALLOWED_ORIGINS = [WEB, MOCK].map((u) => new URL(u).origin);

const isOwn = (url: string) => {
  if (/^(data|blob|about):/.test(url)) return true;
  return ALLOWED_ORIGINS.includes(new URL(url).origin);
};
const isGoogle = (url: string) =>
  /(^|\.)google\.com$|gstatic\.com|googleapis\.com/.test(new URL(url).hostname);

for (const route of routes) {
  test(`Datenschutz: ${route.key}`, async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => urls.push(r.url()));
    await page.goto(route.url, { waitUntil: "load" });
    await page.waitForLoadState("networkidle");

    expect(
      urls.filter((u) => !isOwn(u)),
      "Fremde Anfragen vor Interaktion",
    ).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe("");
    const storage = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    for (const key of [...storage.local, ...storage.session]) {
      expect(ALLOWED_STORAGE_KEYS, `Speicherschlüssel ${key}`).toContain(key);
    }
  });
}

test("Datenschutz: Google-Karte erst nach Klick", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto(`${WEB}/kontakt/`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  expect(urls.filter(isGoogle)).toEqual([]);

  const googleRequest = page.waitForRequest((r) => isGoogle(r.url()));
  await page.locator("[data-load-map]").click();
  await googleRequest;
  expect(await page.evaluate(() => document.cookie)).toBe("");
});

test("Datenschutz: Statistik-Opt-out setzt nur auf Klick den Umami-Schlüssel", async ({
  page,
}) => {
  await page.goto(`${WEB}/datenschutz/`, { waitUntil: "load" });
  expect(await page.evaluate(() => localStorage.getItem("umami.disabled"))).toBe(
    null,
  );
  await page.locator("[data-umami-optout]").click();
  expect(await page.evaluate(() => localStorage.getItem("umami.disabled"))).toBe(
    "1",
  );
  await expect(page.locator("[data-umami-optout-state]")).toContainText(
    "deaktiviert",
  );
  await page.locator("[data-umami-optout]").click();
  expect(await page.evaluate(() => localStorage.getItem("umami.disabled"))).toBe(
    null,
  );
});
