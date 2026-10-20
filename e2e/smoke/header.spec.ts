import { expect, test } from "@playwright/test";
import { WEB } from "../visual/routes";

/**
 * Header: ab 1024 px passen alle Nav-Einträge, Instagram und Pilzkorb
 * in eine Zeile (Pills skalieren fließend), ohne Überlappung und ohne
 * horizontales Scrollen. Darunter übernimmt das Hamburger-Menü.
 */
test("Header bleibt von 1024 bis 1920 px einzeilig", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(`${WEB}/`);

  const failures: string[] = [];
  for (let width = 1024; width <= 1920; width += 16) {
    await page.setViewportSize({ width, height: 800 });
    const r = await page.evaluate(() => {
      const brand = document.querySelector<HTMLElement>(".site-header .brand");
      const items = [
        ...document.querySelectorAll<HTMLElement>(".site-header .nav-links > li > a.nav-pill"),
      ];
      const cart = document.querySelector<HTMLElement>(".site-header .header-cart");
      const tops = new Set(items.map((e) => e.offsetTop));
      const rects = items.map((e) => e.getBoundingClientRect());
      const cartRect = cart?.getBoundingClientRect();
      const last = rects[rects.length - 1];
      const cartVisible = !!cartRect && cartRect.width > 0;
      return {
        count: items.length,
        tops: tops.size,
        overlap: cartVisible && last ? last.right > cartRect.left : false,
        gap: cartVisible && last ? cartRect.left - last.right : 999,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        brandGap:
          brand && rects[0] ? rects[0].left - brand.getBoundingClientRect().right : 999,
        fontSize: parseFloat(getComputedStyle(items[0]).fontSize),
      };
    });
    if (
      r.count < 8 ||
      r.tops !== 1 ||
      r.overlap ||
      (r.gap < 16 && r.gap !== 999) ||
      r.overflow ||
      r.brandGap < 16 ||
      r.fontSize < 14
    ) {
      failures.push(`${width}px: ${JSON.stringify(r)}`);
    }
  }
  expect(failures).toEqual([]);
});
