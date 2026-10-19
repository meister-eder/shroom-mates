import { expect, test } from "@playwright/test";

const SHOP = process.env.VISUAL_SHOP_URL ?? "http://localhost:8000";

test("Pilzkorb: Sortiment, Produkt, Korb, Kasse", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(`${SHOP}/shop/`);
  await page.locator('a[href$="/shop/rosenseitling-growkit/"]').first().click();
  await expect(page).toHaveURL(/rosenseitling-growkit/);

  const add = page.getByRole("button", { name: "Rein ins Körbchen" });
  await expect(add).toBeEnabled();
  await add.click();

  const headerCart = page.getByRole("button", {
    name: /^Pilzkorb, \d+ Artikel/,
  });
  await expect(headerCart).toHaveAttribute("aria-label", /Pilzkorb, 1 Artikel/);

  await headerCart.click();
  const drawer = page.getByRole("dialog", { name: "Pilzkorb" });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator(".cart-line")).toHaveCount(1);

  await drawer.getByRole("button", { name: "Menge erhöhen" }).click();
  await expect(headerCart).toHaveAttribute("aria-label", /Pilzkorb, 2 Artikel/);

  await page.goto(`${SHOP}/shop/cart/`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/Rosenseitling/).first()).toBeVisible();

  await page.goto(`${SHOP}/shop/checkout/`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Kasse" }),
  ).toBeVisible();
  await expect(page.getByLabel("Vorname *")).toBeVisible();

  expect(errors).toEqual([]);
});
