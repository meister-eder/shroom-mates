import { expect, test } from "@playwright/test";

const SHOP = process.env.VISUAL_SHOP_URL ?? "http://localhost:8000";

// Old `/de/...` URLs 301 to the new paths; query strings survive (SumUp sends
// buyers back to /de/checkout/complete?...).
const cases: [string, string][] = [
  ["/de/store", "/shop/"],
  ["/de/store/rosenseitling-growkit", "/shop/rosenseitling-growkit/"],
  ["/de/cart", "/shop/cart/"],
  ["/de/checkout?step=payment", "/shop/checkout/?step=payment"],
  [
    "/de/checkout/complete?checkout_id=abc&status=paid",
    "/shop/checkout/complete/?checkout_id=abc&status=paid",
  ],
  ["/de/order/order_01", "/shop/order/order_01/"],
  ["/de/agb", "/agb/"],
  ["/de/widerruf", "/widerruf/"],
  ["/de/gewaehrleistung", "/gewaehrleistung/"],
  ["/de/vertrag-widerrufen", "/vertrag-widerrufen/"],
  ["/de/datenschutz", "/datenschutz/"],
  ["/de", "/shop/"],
];

for (const [from, to] of cases) {
  test(`legacy ${from} -> ${to}`, async ({ request }) => {
    const res = await request.get(`${SHOP}${from}`, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers().location).toBe(to);
  });
}
