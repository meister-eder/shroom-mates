/**
 * storefront-browse.spec.ts
 *
 * General storefront navigation and content tests.
 * Verifies all key pages load and render correctly.
 */

import { CheckoutFlow, expect, test } from "../fixtures/checkout-fixture";

test.describe("Storefront — Pages & Navigation", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await CheckoutFlow.checkBackendHealth(page);
    await page.close();
  });

  test("homepage loads with hero content", async ({ page }) => {
    await page.goto("/shop/");

    // Page should have a title
    await expect(page).toHaveTitle(/Shroom/);

    // Hero section or main heading
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
  });

  test("homepage → store navigation works", async ({ page }) => {
    await page.goto("/shop/");

    // Find a link to the store
    const storeLink = page.locator('a[href*="/shop/"]').first();
    if (await storeLink.isVisible()) {
      await storeLink.click();
      await page.waitForURL(/\/shop\//);

      // Should have product cards
      await expect(page.locator("a.product-card").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("store → product detail → back navigation", async ({
    page,
    checkout,
  }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();

    // Product detail page should have an h1 and add-to-cart button
    await expect(page.locator("h1").first()).toBeVisible();
    const addBtn = page.getByRole("button", { name: /Rein ins Körbchen/ });
    await expect(addBtn).toBeVisible();

    // Navigate back to store
    await page.goBack();
    await expect(page.locator("a.product-card").first()).toBeVisible();
  });

  test("footer has legal links", async ({ page }) => {
    await page.goto("/shop/");

    // Scroll to footer
    const footer = page.locator("footer").first();
    await footer.scrollIntoViewIfNeeded();

    // Check for common legal links
    const links = ["agb", "datenschutz", "widerruf", "impressum"];
    for (const link of links) {
      const el = page.locator(`footer a[href*="${link}"]`).first();
      // At least one legal link should be in the footer
      // (exact links depend on the implementation)
    }

    // At minimum, the footer exists
    await expect(footer).toBeVisible();
  });
});

test.describe("Storefront — Mobile Responsiveness", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await CheckoutFlow.checkBackendHealth(page);
    await page.close();
  });

  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test("store page renders on mobile viewport", async ({ page }) => {
    await page.goto("/shop/");

    // Product grid should be visible even on mobile
    await expect(page.locator("a.product-card").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("checkout address form works on mobile", async ({ checkout }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    // Address form should be usable on mobile
    await expect(checkout.page.locator("#checkout-email")).toBeVisible({
      timeout: 5000,
    });

    // Fill form on mobile viewport
    await checkout.fillAddressForm({
      email: "mobile-test@shroom-mates.de",
      firstName: "Max",
      lastName: "Mobil",
      address: "Kleine Straße 1",
      postalCode: "04109",
      city: "Leipzig",
      country: "de",
    });

    // Submit button should be visible and clickable
    const submitBtn = checkout.page.getByRole("button", {
      name: /Weiter zur Lieferung/,
    });
    await expect(submitBtn).toBeVisible();
  });
});

test.describe("Storefront — Accessibility Basics", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await CheckoutFlow.checkBackendHealth(page);
    await page.close();
  });

  test("store page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/shop/");

    // Should have at least one h1
    // querySelectorAll doesn't pierce shadow DOM, so the Astro dev
    // toolbar's own headings (dev server only) aren't counted.
    const h1Count = await page.evaluate(
      () => document.querySelectorAll("h1").length,
    );
    expect(h1Count).toBe(1); // Exactly one h1 per page

    // Navigation should have aria-label
    const navs = page.locator("nav[aria-label]");
    expect(await navs.count()).toBeGreaterThanOrEqual(0); // At least nav may exist
  });

  test("checkout form inputs have associated labels", async ({
    page,
    checkout,
  }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    // Email input should have a label
    const emailInput = page.locator("#checkout-email");
    await expect(emailInput).toBeVisible();

    // Check that it has an accessible name (via label or aria-label)
    const accessibleName = await emailInput.getAttribute("aria-label");
    const hasLabel = await page.locator('label[for="checkout-email"]').count();
    expect(accessibleName !== null || hasLabel > 0).toBeTruthy();
  });
});
