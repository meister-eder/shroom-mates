import { expect, test } from "@playwright/test";

// § 356a BGB: "Vertrag widerrufen" must be reachable from every shop page
// and confirm receipt (with date and time) after "Widerruf bestätigen".
test.describe("Withdrawal function", () => {
  test("footer button leads to the form; submission is confirmed", async ({ page }) => {
    await page.goto("/de/store");
    await page.getByRole("link", { name: "Vertrag widerrufen" }).click();
    await expect(page).toHaveURL(/\/de\/vertrag-widerrufen$/);

    await page.fill("#withdraw-name", "E2E Test");
    await page.fill("#withdraw-email", "e2e-withdrawal@example.com");
    await page.fill("#withdraw-order", "#1");
    await page.getByRole("button", { name: "Widerruf bestätigen" }).click();

    const status = page.getByRole("status");
    await expect(status).toContainText("Dein Widerruf ist eingegangen", { timeout: 15_000 });
    await expect(status).toContainText(/\d{2}:\d{2}:\d{2}/);
  });

  test("only name, email and order number are required", async ({ page }) => {
    await page.goto("/de/vertrag-widerrufen");
    for (const id of ["#withdraw-name", "#withdraw-email", "#withdraw-order"]) {
      await expect(page.locator(id)).toHaveAttribute("required", "");
    }
    for (const id of ["#withdraw-items", "#withdraw-message"]) {
      await expect(page.locator(id)).not.toHaveAttribute("required", "");
    }
  });
});
