import { expect, test } from "@playwright/test";
import { WEB } from "../visual/routes";

/**
 * Umami-Tracker: nur gegen einen Build mit gesetzter PUBLIC_UMAMI_WEBSITE_ID
 * (`scripts/verify-umami.sh`, Dummy-ID). Im normalen Build ist kein Tracker
 * vorhanden, dann wird der Test übersprungen.
 *
 * Der echte Tracker läuft nur auf dem Server (Umami-Container), hier ersetzt
 * ein kleiner Stub `/stats/s.js`: er liest `data-before-send` wie der echte
 * Tracker, ruft den Handler vor dem Senden auf und schickt an `/stats/e`.
 */
const WEBSITE_ID = "00000000-0000-0000-0000-000000000000";
const STUB = `
(() => {
  const s = document.currentScript;
  const send = (payload) => {
    const hook = window[s.dataset.beforeSend];
    const out = hook ? hook("event", payload) : payload;
    if (out) fetch("/stats/e", { method: "POST", body: JSON.stringify({ type: "event", payload: out }), keepalive: true });
  };
  window.umami = { track: (name, data) => send({ url: location.pathname + location.search, name, data }) };
  send({ url: location.pathname + location.search, referrer: document.referrer });
})();
`;

test("Umami: Tracker-Tag ist extern, same-origin und trägt die Datenschutz-Optionen", async ({
  page,
}) => {
  await page.goto(`${WEB}/`);
  const tag = page.locator('script[src="/stats/s.js"]');
  const count = await tag.count();
  test.skip(count === 0, "Build ohne PUBLIC_UMAMI_WEBSITE_ID");
  await expect(tag).toHaveCount(1);
  await expect(tag).toHaveAttribute("data-website-id", WEBSITE_ID);
  await expect(tag).toHaveAttribute("data-do-not-track", "true");
  await expect(tag).toHaveAttribute("data-exclude-search", "true");
  await expect(tag).toHaveAttribute("data-exclude-hash", "true");
  await expect(tag).toHaveAttribute("data-before-send", "umamiBeforeSend");
  const src = await tag.evaluate((el: HTMLScriptElement) => el.src);
  expect(new URL(src).origin).toBe(new URL(page.url()).origin);
  expect(await tag.evaluate((el: HTMLScriptElement) => el.defer)).toBe(true);
});

test("Umami: Bestellseite sendet normalisierte URL, Kauf ohne Bestell-ID", async ({
  page,
  request,
}) => {
  await page.goto(`${WEB}/`);
  test.skip(
    (await page.locator('script[src="/stats/s.js"]').count()) === 0,
    "Build ohne PUBLIC_UMAMI_WEBSITE_ID",
  );

  // Bestellung über den Medusa-Mock anlegen (Warenkorb im Browser, dann abschließen)
  const mock = process.env.VISUAL_MOCK_URL ?? "http://localhost:9010";
  const headers = { "x-publishable-api-key": "pk_test" };
  const regions = await (await request.get(`${mock}/store/regions`, { headers })).json();
  const products = await (
    await request.get(`${mock}/store/products?region_id=${regions.regions[0].id}`, { headers })
  ).json();
  const variant = products.products[0].variants[0].id;
  const { cart } = await (
    await request.post(`${mock}/store/carts`, { headers, data: { region_id: regions.regions[0].id } })
  ).json();
  await request.post(`${mock}/store/carts/${cart.id}/line-items`, {
    headers,
    data: { variant_id: variant, quantity: 1 },
  });
  const post = async (path: string, data: object) =>
    (await request.post(`${mock}${path}`, { headers, data })).json();
  await post(`/store/carts/${cart.id}`, {
    email: "test@example.com",
    shipping_address: {
      first_name: "Test",
      last_name: "Person",
      address_1: "Teststraße 1",
      city: "Leipzig",
      postal_code: "04179",
      country_code: "de",
    },
  });
  const { shipping_options } = await (
    await request.get(`${mock}/store/shipping-options?cart_id=${cart.id}`, { headers })
  ).json();
  await post(`/store/carts/${cart.id}/shipping-methods`, {
    option_id: shipping_options[0].id,
  });
  const { payment_collection } = await post("/store/payment-collections", {
    cart_id: cart.id,
  });
  await post(`/store/payment-collections/${payment_collection.id}/payment-sessions`, {
    provider_id: "pp_system_default",
  });
  const done = await post(`/store/carts/${cart.id}/complete`, {});
  const orderId: string = done.order.id;

  const sent: { url?: string; name?: string; data?: Record<string, unknown> }[] = [];
  await page.route("**/stats/s.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: STUB }),
  );
  await page.route("**/stats/e", async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? "{}").payload);
    await route.fulfill({ status: 200, body: "{}" });
  });

  await page.goto(`${WEB}/shop/order/${orderId}/?utm=1`);
  await expect.poll(() => sent.length).toBeGreaterThanOrEqual(2);

  const urls = sent.map((p) => p.url);
  expect(urls.every((u) => u === "/shop/order/")).toBe(true);
  expect(JSON.stringify(sent)).not.toContain(orderId);
  const purchase = sent.find((p) => p.name === "purchase");
  expect(purchase?.data).toMatchObject({ currency: "EUR" });
  expect(typeof purchase?.data?.revenue).toBe("number");
});
