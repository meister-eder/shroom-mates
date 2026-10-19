import { type APIRequestContext, expect, test } from "@playwright/test";

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

// Without a trailing slash the Node adapter first adds one (301), then the
// legacy route maps to the new path (301): follow the chain by hand.
async function followRedirects(
  request: APIRequestContext,
  start: string,
): Promise<string> {
  let current = new URL(start, SHOP);
  for (let hop = 0; hop < 4; hop++) {
    const res = await request.get(current.href, { maxRedirects: 0 });
    if (res.status() !== 301) return `${current.pathname}${current.search}`;
    current = new URL(res.headers().location, current);
  }
  throw new Error(`Too many redirects for ${start}`);
}

for (const [from, to] of cases) {
  test(`legacy ${from} -> ${to}`, async ({ request }) => {
    expect(await followRedirects(request, from)).toBe(to);
  });
}

test("Pfade ohne Slash bekommen einen Slash, Query bleibt", async ({
  request,
}) => {
  expect(await followRedirects(request, "/shop/checkout/complete?x=1")).toBe(
    "/shop/checkout/complete/?x=1",
  );
});
