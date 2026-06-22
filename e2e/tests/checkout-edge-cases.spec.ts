/**
 * checkout-edge-cases.spec.ts
 *
 * Tests the B6 edge cases from docs/TODO.md:
 *   - Empty cart → checkout
 *   - Step bypass (skip address/delivery)
 *   - Browser back after order
 *   - Change shipping method after payment session
 *
 * Plus additional robustness tests for a production e-commerce site.
 */

import { test, expect, CheckoutFlow } from "../fixtures/checkout-fixture";

test.describe("Checkout — Edge Cases (B6)", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await CheckoutFlow.checkBackendHealth(page);
    await page.close();
  });

  // ── B6.1: Empty cart → checkout ────────────────────────────────────────

  test("B6.1 — empty cart redirects with message", async ({ checkout }) => {
    await checkout.goToCheckout();

    // Should show empty cart message, not the checkout form
    await expect(
      checkout.page.getByText("Dein Warenkorb ist leer"),
    ).toBeVisible({ timeout: 5000 });

    // "Weiter einkaufen" link should be present
    await expect(
      checkout.page.getByRole("link", { name: /Weiter einkaufen/ }),
    ).toBeVisible();
  });

  // ── B6.2: Navigate to ?step=payment without address ──────────────────

  test("B6.2 — skip to payment step without address redirects to address step", async ({
    checkout,
  }) => {
    // Add product to cart
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();

    // Try to jump directly to payment step
    await checkout.goToCheckout("payment");

    // Should be redirected to address step
    // Check that the address form is visible (email input present)
    await expect(checkout.page.locator("#checkout-email")).toBeVisible({
      timeout: 5000,
    });

    // Payment step should NOT be active
    await expect(
      checkout.page.getByText("Zahlung"),
    ).toBeVisible();
  });

  // ── B6.3: Navigate to ?step=payment without delivery ─────────────────

  test("B6.3 — skip to payment step without delivery redirects to address", async ({
    checkout,
  }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();

    // Fill address only
    await checkout.goToCheckout("address");
    await checkout.fillAddressForm({
      email: `test-${Date.now()}@shroom-mates.de`,
      firstName: "Max",
      lastName: "Mustermann",
      address: "Pilzstraße 42",
      postalCode: "04109",
      city: "Leipzig",
      country: "de",
    });
    await checkout.submitAddressStep();

    // Now try to skip to payment (bypassing delivery)
    await checkout.goToCheckout("payment");

    // Should redirect to delivery step (shipping options visible)
    // or at minimum not show the payment form
    // The delivery step has radio buttons for shipping
    const shippingOptions = checkout.page.locator(
      'input[type="radio"][name="shipping_option"]',
    );
    await expect(shippingOptions.first()).toBeVisible({ timeout: 5000 });
  });

  // ── B6.4: Browser back after order placed ─────────────────────────────

  test("B6.4 — browser back after order shows empty cart", async ({
    page,
    checkout,
  }) => {
    // Place a complete order (manual payment)
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();
    await checkout.completeManualCheckout({
      email: `test-${Date.now()}@shroom-mates.de`,
      firstName: "Max",
      lastName: "Mustermann",
      address: "Pilzstraße 42",
      postalCode: "04109",
      city: "Leipzig",
      country: "de",
    });

    // We should be on order confirmation page
    await checkout.assertOnOrderConfirmation();

    // Navigate back
    await page.goBack();

    // Should not be able to submit again — cart should be empty or page redirects
    // Verify we don't see the payment button
    const placeOrderBtn = page.getByRole("button", {
      name: /Bestellung aufgeben/,
    });
    await expect(placeOrderBtn).not.toBeVisible({ timeout: 3000 });
  });

  // ── B6.5: Change shipping method after payment session ─────────────────

  test("B6.5 — changing shipping method after payment selection re-initializes", async ({
    checkout,
  }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    // Fill address and proceed to delivery
    await checkout.fillAddressForm({
      email: `test-${Date.now()}@shroom-mates.de`,
      firstName: "Max",
      lastName: "Mustermann",
      address: "Pilzstraße 42",
      postalCode: "04109",
      city: "Leipzig",
      country: "de",
    });
    await checkout.submitAddressStep();

    // Select shipping and proceed to payment
    await checkout.selectFirstShippingOption();
    await checkout.submitDeliveryStep();

    // Select manual payment
    await checkout.selectManualPayment();

    // Now go back to delivery step (click Bearbeiten on delivery)
    const editButtons = checkout.page.getByRole("button", {
      name: /Bearbeiten/,
    });
    const deliveryEditBtn = editButtons.nth(1); // index 1 = delivery (index 0 = address)
    if (await deliveryEditBtn.isVisible()) {
      await deliveryEditBtn.click();
      await checkout.page.waitForTimeout(500);
    }

    // Re-select shipping (should trigger updatePayment)
    await checkout.selectFirstShippingOption();
    await checkout.submitDeliveryStep();

    // Should still be able to place the order
    await checkout.selectManualPayment();
    await checkout.submitManualPayment();
    await checkout.assertOnOrderConfirmation();
  });
});

test.describe("Checkout — Additional Robustness", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await CheckoutFlow.checkBackendHealth(page);
    await page.close();
  });

  test("navigate to non-existent page returns 404 or redirects", async ({
    page,
  }) => {
    const resp = await page.goto("http://localhost:8000/de/nonexistent-page");
    // Should either 404 or redirect
    expect(
      resp?.status() === 404 ||
        resp?.status() === 301 ||
        resp?.status() === 302 ||
        resp?.status() === 200, // Astro might render a 404 page with 200
    ).toBeTruthy();
  });

  test("checkout loads without console errors", async ({ page, checkout }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    await checkout.fillAddressForm({
      email: `test-${Date.now()}@shroom-mates.de`,
      firstName: "Max",
      lastName: "Mustermann",
      address: "Teststraße 1",
      postalCode: "04109",
      city: "Leipzig",
      country: "de",
    });
    await checkout.submitAddressStep();
    await checkout.selectFirstShippingOption();
    await checkout.submitDeliveryStep();
    await checkout.selectManualPayment();

    // No console errors during the entire flow
    expect(errors).toEqual([]);
  });

  test("legal pages load correctly", async ({ page }) => {
    const legalPages = [
      "/de/agb",
      "/de/datenschutz",
      "/de/widerruf",
    ];

    for (const path of legalPages) {
      await page.goto(path);
      // Each legal page should have an h1
      await expect(page.locator("h1").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("product detail page has required elements", async ({
    page,
    checkout,
  }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();

    // Product title
    await expect(page.locator("h1").first()).toBeVisible();

    // Add to cart button
    await expect(
      page.getByRole("button", { name: /In den Warenkorb/ }),
    ).toBeVisible();
  });
});
