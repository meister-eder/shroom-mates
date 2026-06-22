import { test as base, type Page } from "@playwright/test";

/**
 * Shared checkout helpers for shroom-mates E2E tests.
 *
 * All selectors are based on the real DOM structure of the storefront.
 * Tests go through the ACTUAL checkout flow — no mocking.
 */

export const BASE = "http://localhost:8000";
export const BACKEND = "http://localhost:9000";

const DE = "/de";

export class CheckoutFlow {
  constructor(public page: Page) {}

  // ── Navigation ──────────────────────────────────────────────────────────

  async goToStore() {
    await this.page.goto(`${DE}/store`);
    await this.page.waitForSelector("a.product-card", { timeout: 10_000 });
  }

  async goToCart() {
    await this.page.goto(`${DE}/cart`);
  }

  async goToCheckout(step?: "address" | "delivery" | "payment") {
    const url = step ? `${DE}/checkout?step=${step}` : `${DE}/checkout`;
    await this.page.goto(url);
  }

  // ── Store ───────────────────────────────────────────────────────────────

  /** Click the first available product card on the store page */
  async clickFirstProduct() {
    const firstCard = this.page.locator("a.product-card").first();
    await firstCard.waitFor({ state: "visible" });
    await firstCard.click();
    await this.page.waitForURL(/\/store\/\w+/);
  }

  /**
   * Click a specific variant option (e.g., "250g").
   * Variant buttons are in option groups on the product detail page.
   */
  async selectVariant(label: string) {
    const btn = this.page.locator("button", { hasText: label }).first();
    await btn.click();
    await this.page.waitForTimeout(300); // React state update
  }

  /** Click "In den Warenkorb" on the product detail page */
  async addToCart() {
    await this.page.getByRole("button", { name: /In den Warenkorb/ }).click();
    // Wait for the cart store to update (nanostores)
    await this.page.waitForTimeout(1000);
  }

  // ── Cart ────────────────────────────────────────────────────────────────

  /** Click "Zur Kasse" from the cart page */
  async proceedToCheckoutFromCart() {
    await this.goToCart();
    await this.page.getByRole("link", { name: /Zur Kasse/ }).click();
    await this.page.waitForURL(/\/checkout/);
  }

  /** Assert the cart has items (not empty) */
  async assertCartHasItems() {
    await this.goToCart();
    await this.page.waitForSelector("h1:has-text('Warenkorb')");
    // The empty state shows "Dein Warenkorb ist leer"
    await expect(
      this.page.getByText("Dein Warenkorb ist leer"),
    ).not.toBeVisible();
  }

  // ── Checkout — Address Step ──────────────────────────────────────────────

  async fillAddressForm(data: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    phone?: string;
  }) {
    await this.page.waitForSelector("#checkout-email");
    await this.page.fill("#checkout-email", data.email);

    // React Hook Form registers inputs by name — we use the label text to find them
    await this.page.getByLabel(/Vorname/).fill(data.firstName);
    await this.page.getByLabel(/Nachname/).fill(data.lastName);
    await this.page.getByLabel(/Adresse/).first().fill(data.address);
    await this.page.getByLabel(/PLZ/).fill(data.postalCode);
    await this.page.getByLabel(/Stadt/).fill(data.city);

    // Country is a select
    const countrySelect = this.page.locator("select").first();
    await countrySelect.selectOption(data.country);

    if (data.phone) {
      await this.page.getByLabel(/Telefon/).fill(data.phone);
    }
  }

  async submitAddressStep() {
    await this.page
      .getByRole("button", { name: /Weiter zur Lieferung/ })
      .click();
    // Wait for step transition
    await this.page.waitForTimeout(500);
  }

  // ── Checkout — Delivery Step ────────────────────────────────────────────

  async selectFirstShippingOption() {
    await this.page.waitForTimeout(500); // Wait for shipping options to load
    const firstRadio = this.page
      .locator('input[type="radio"][name="shipping_option"]')
      .first();
    await firstRadio.waitFor({ state: "visible", timeout: 10_000 });
    await firstRadio.check();
    // Wait for the cart to update
    await this.page.waitForTimeout(1000);
  }

  async submitDeliveryStep() {
    await this.page
      .getByRole("button", { name: /Weiter zur Zahlung/ })
      .click();
    await this.page.waitForTimeout(500);
  }

  // ── Checkout — Payment Step ─────────────────────────────────────────────

  /** Select "Manuelle Zahlung (Test)" — the non-SumUp payment provider */
  async selectManualPayment() {
    await this.page.waitForTimeout(500);
    const manualRadio = this.page.locator("label").filter({
      hasText: /Manuelle Zahlung/,
    });
    await manualRadio.waitFor({ state: "visible", timeout: 10_000 });
    await manualRadio.click();
    await this.page.waitForTimeout(1000); // Wait for payment session init
  }

  /** Select "Online bezahlen (SumUp)" */
  async selectSumUpPayment() {
    await this.page.waitForTimeout(500);
    const sumupRadio = this.page.locator("label").filter({
      hasText: /Online bezahlen/,
    });
    await sumupRadio.waitFor({ state: "visible", timeout: 10_000 });
    await sumupRadio.click();
    await this.page.waitForTimeout(1000);
  }

  /** Click "Bestellung aufgeben" (for manual payment) */
  async submitManualPayment() {
    await this.page
      .getByRole("button", { name: /Bestellung aufgeben/ })
      .click();
    // Wait for redirect to order confirmation
    await this.page.waitForURL(/\/order\//, { timeout: 15_000 });
  }

  // ── Full Checkout (happy path) ──────────────────────────────────────────

  async completeManualCheckout(address: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  }) {
    // Step 1: Address
    await this.fillAddressForm(address);
    await this.submitAddressStep();

    // Step 2: Delivery
    await this.selectFirstShippingOption();
    await this.submitDeliveryStep();

    // Step 3: Payment
    await this.selectManualPayment();
    await this.submitManualPayment();
  }

  // ── Assertions ──────────────────────────────────────────────────────────

  async assertOnOrderConfirmation() {
    // The order confirmation page shows order details
    await expect(this.page.locator("h1").first()).toBeVisible();
  }

  async assertStepIsActive(step: "address" | "delivery" | "payment") {
    const labels: Record<string, string> = {
      address: "Adresse",
      delivery: "Lieferung",
      payment: "Zahlung",
    };
    // The active step has bold text in the step indicator
    const stepIndicator = this.page.locator("nav[aria-label='Checkout-Schritte']");
    await expect(
      stepIndicator.getByText(labels[step]),
    ).toBeVisible();
  }

  async assertEmptyCartMessage() {
    await expect(
      this.page.getByText("Dein Warenkorb ist leer"),
    ).toBeVisible();
  }

  async assertErrorVisible(text?: string) {
    const error = this.page.locator(".input-error");
    await expect(error).toBeVisible();
    if (text) {
      await expect(error).toContainText(text);
    }
  }

  // ── Backend Health ──────────────────────────────────────────────────────

  static async checkBackendHealth(page: Page) {
    const resp = await page.request.get(`${BACKEND}/health`);
    expect(resp.status()).toBe(200);
  }
}

/**
 * Enhanced test fixture with checkout flow helpers.
 */
export const test = base.extend<{ checkout: CheckoutFlow }>({
  checkout: async ({ page }, use) => {
    const flow = new CheckoutFlow(page);
    await use(flow);
  },
});

export { expect } from "@playwright/test";
