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

test("Quick-Add im Sortiment zeigt Toast und erhöht den Zähler", async ({
  page,
}) => {
  await page.goto(`${SHOP}/shop/`);
  const quick = page.locator("[data-quick-add]").first();
  await expect(quick).toBeEnabled();
  await quick.click();
  await expect(quick).toBeDisabled();
  await expect(quick).toContainText("Wird hinzugefügt");

  const toast = page.locator(".toast-region .toast");
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("liegt im Körbchen!");
  await expect(
    page.getByRole("button", { name: /^Pilzkorb, 1 Artikel/ }),
  ).toBeVisible();
});

test("Pilzkorb: Drawer verlinkt die Seite, Pille auf /shop/cart/ ist ein Link", async ({
  page,
}) => {
  await page.goto(`${SHOP}/shop/`);
  await page.locator("[data-quick-add]").first().click();
  const pill = page.getByRole("button", { name: /^Pilzkorb, 1 Artikel/ });
  await expect(pill).toBeVisible();
  await pill.click();
  const drawer = page.getByRole("dialog", { name: "Pilzkorb" });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("link", { name: "Pilzkorb ansehen" }),
  ).toHaveAttribute("href", "/shop/cart/");

  await page.goto(`${SHOP}/shop/cart/`);
  const link = page.getByRole("link", { name: /^Pilzkorb, \d+ Artikel/ });
  await expect(link).toHaveAttribute("href", "/shop/cart/");
  await link.click();
  await expect(page.getByRole("dialog", { name: "Pilzkorb" })).toBeHidden();
  await expect(page).toHaveURL(/\/shop\/cart\/$/);
});

test("Pilzkorb-Seite: Entfernen blendet die Zeile sofort aus", async ({
  page,
}) => {
  await page.goto(`${SHOP}/shop/`);
  const quick = page.locator("[data-quick-add]").first();
  await expect(quick).toBeEnabled();
  await quick.click();
  await expect(page.locator(".toast-region .toast")).toBeVisible();

  await page.goto(`${SHOP}/shop/cart/`);
  const rows = page.locator(".cartpage-item");
  await expect(rows).toHaveCount(1);
  // Slow the sync down: the row must vanish without waiting for it.
  await page.route("**/store/carts/**", async (route) => {
    await new Promise((r) => setTimeout(r, 3000));
    await route.continue();
  });
  await page
    .getByRole("button", { name: /aus dem Pilzkorb entfernen/ })
    .click();
  await expect(rows).toHaveCount(0, { timeout: 1000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Hier wächst noch nichts." }),
  ).toBeVisible();
});
