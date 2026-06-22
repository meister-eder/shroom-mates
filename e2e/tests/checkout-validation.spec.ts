/**
 * checkout-validation.spec.ts
 *
 * Form validation tests — verify error messages appear for invalid input.
 * Tests both server-side (empty fields, bad format) and edge cases.
 */

import { test, expect, CheckoutFlow } from "../fixtures/checkout-fixture";

test.describe("Checkout — Form Validation", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await CheckoutFlow.checkBackendHealth(page);
    await page.close();
  });

  test("address step — shows validation errors for empty required fields", async ({
    checkout,
  }) => {
    // Add product to cart so checkout is accessible
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    // Submit the address form without filling anything
    await checkout.page
      .getByRole("button", { name: /Weiter zur Lieferung/ })
      .click();

    // Should show validation errors
    await expect(checkout.page.locator(".input-error").first()).toBeVisible({
      timeout: 3000,
    });
  });

  test("address step — invalid email shows error", async ({ checkout }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    await checkout.page.waitForSelector("#checkout-email");
    await checkout.page.fill("#checkout-email", "not-an-email");
    await checkout.page
      .getByRole("button", { name: /Weiter zur Lieferung/ })
      .click();

    // Should show email validation error
    const emailError = checkout.page.locator(".input-error").filter({
      hasText: /E-Mail/,
    });
    await expect(emailError.first()).toBeVisible({ timeout: 3000 });
  });

  test("address step — missing first name shows error", async ({
    checkout,
  }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    await checkout.page.waitForSelector("#checkout-email");
    // Fill everything except first name
    await checkout.page.fill("#checkout-email", "test@test.de");
    await checkout.page.getByLabel(/Nachname/).fill("Muster");
    await checkout.page.getByLabel(/Adresse/).first().fill("Teststr 1");
    await checkout.page.getByLabel(/PLZ/).fill("04109");
    await checkout.page.getByLabel(/Stadt/).fill("Leipzig");

    await checkout.page
      .getByRole("button", { name: /Weiter zur Lieferung/ })
      .click();

    const nameError = checkout.page.locator(".input-error").filter({
      hasText: /Vorname/,
    });
    await expect(nameError.first()).toBeVisible({ timeout: 3000 });
  });

  test("billing address — toggle separate billing shows extra fields", async ({
    checkout,
  }) => {
    await checkout.goToStore();
    await checkout.clickFirstProduct();
    await checkout.addToCart();
    await checkout.proceedToCheckoutFromCart();

    await checkout.page.waitForSelector("#checkout-email");

    // Uncheck "billing same as shipping"
    const billingCheckbox = checkout.page.getByLabel(
      /Rechnungsadresse entspricht/,
    );
    await billingCheckbox.uncheck();

    // Billing address fields should appear
    // The billing section has a heading "Rechnungsadresse"
    await expect(
      checkout.page.getByText("Rechnungsadresse"),
    ).toBeVisible();
  });
});
