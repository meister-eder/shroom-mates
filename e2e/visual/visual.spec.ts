import { expect, type Page, test } from "@playwright/test";
import { MOCK, routes } from "./routes";

/** Pilzkorb mit einem Artikel im Mock anlegen und als cart_id hinterlegen. */
async function seedCart(page: Page) {
  const api = page.request;
  const { products } = await (
    await api.get(`${MOCK}/store/products?handle=rosenseitling-growkit`)
  ).json();
  const variantId = products[0].variants[0].id;
  const { cart } = await (
    await api.post(`${MOCK}/store/carts`, { data: { region_id: "reg_de" } })
  ).json();
  await api.post(`${MOCK}/store/carts/${cart.id}/line-items`, {
    data: { variant_id: variantId, quantity: 2 },
  });
  await page.addInitScript((id) => {
    localStorage.setItem("cart_id", id);
  }, cart.id);
}

/** Lazy-Bilder laden, Fonts abwarten, einmal durchscrollen (Reveal/Lazy). */
async function settle(page: Page) {
  await page.evaluate(() => {
    for (const img of document.querySelectorAll("img[loading=lazy]")) {
      img.setAttribute("loading", "eager");
    }
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((r) => img.addEventListener("load", r, { once: true })),
      ),
    ),
  );
  await page.waitForTimeout(300);
}

for (const route of routes) {
  test(route.key, async ({ page }, testInfo) => {
    if (route.cart) await seedCart(page);
    await page.goto(route.url, { waitUntil: "load" });
    await settle(page);
    await expect(page).toHaveScreenshot(
      `${route.key}-${testInfo.project.name}.png`,
      {
        fullPage: true,
        // Externe Karten/iframes und Zufalls-Animationen ausblenden
        mask: [page.locator("iframe")],
      },
    );
  });
}
