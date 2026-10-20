import { expect, test } from "@playwright/test";
import { WEB } from "../visual/routes";

/**
 * Seitenkopf: Jede Seite beginnt am selben linken Rand (Header-Container),
 * Seiten mit PageHero haben dieselbe h1-Oberkante, und der h1 trägt die
 * sichtbare Headline (nicht die kleine Eyebrow-Zeile).
 */
const PATHS = [
  "/",
  "/unsere-pilze/",
  "/growkits/",
  "/tinkturen/",
  "/gastronomie/",
  "/ueber-uns/",
  "/faq/",
  "/kontakt/",
  "/impressum/",
  "/agb/",
  "/shop/",
  "/shop/cart/",
];

/**
 * Noch nicht auf PageHero umgestellte Seiten. Einträge entfernen, sobald die
 * Seite migriert ist: Dann gelten alle drei Prüfungen auch für sie.
 */
const NOT_YET_MIGRATED = new Set([
  "/",
  "/unsere-pilze/",
  "/tinkturen/",
  "/gastronomie/",
  "/ueber-uns/",
  "/faq/",
  "/kontakt/",
  "/impressum/",
  "/agb/",
  "/shop/",
  "/shop/cart/",
]);

for (const width of [390, 1280, 1512]) {
  test(`Seitenkopf gleich ausgerichtet bei ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const failures: string[] = [];
    const tops: Record<string, number> = {};

    for (const path of PATHS) {
      await page.goto(`${WEB}${path}`);
      if (NOT_YET_MIGRATED.has(path)) continue;
      // Shop-Seiten hydrieren erst im Browser
      await page.locator("main h1").first().waitFor({ timeout: 10_000 }).catch(() => {});
      const m = await page.evaluate(() => {
        const h1s = document.querySelectorAll("main h1");
        const h1 = h1s[0] as HTMLElement | undefined;
        const nav = document.querySelector<HTMLElement>(".site-nav");
        if (!h1 || !nav) return null;
        const navLeft =
          nav.getBoundingClientRect().left +
          Number.parseFloat(getComputedStyle(nav).paddingLeft);
        const sizes = [h1, ...h1.querySelectorAll<HTMLElement>("*")].map((e) =>
          Number.parseFloat(getComputedStyle(e).fontSize),
        );
        const rect = h1.getBoundingClientRect();
        return {
          count: h1s.length,
          left: rect.left,
          top: rect.top + window.scrollY,
          navLeft,
          maxFont: Math.max(...sizes),
          hero: !!document.querySelector(".page-hero"),
        };
      });
      if (!m) {
        failures.push(`${path}: kein h1 oder keine Navigation`);
        continue;
      }
      if (m.count !== 1) failures.push(`${path}: ${m.count} h1`);
      if (Math.abs(m.left - m.navLeft) > 1)
        failures.push(`${path}: h1 links ${m.left}, Header ${m.navLeft}`);
      if (width >= 1280 && m.maxFont < 32)
        failures.push(`${path}: h1 nur ${m.maxFont}px`);
      if (m.hero) tops[path] = m.top;
    }

    const values = Object.values(tops);
    if (values.length > 1 && Math.max(...values) - Math.min(...values) > 1)
      failures.push(`h1-Oberkante uneinheitlich: ${JSON.stringify(tops)}`);

    expect(failures).toEqual([]);
  });
}
