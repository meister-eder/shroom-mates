// Stateful in-memory fake of the Medusa v2 Store API, just enough to click
// through the storefront (shop, PDP, cart, checkout, order confirmation)
// without Docker/Postgres/Redis.
//
//   node mock-medusa.mjs            # listens on :9000
//   PORT=9100 node mock-medusa.mjs
//
// All state (carts, orders) lives in memory and is lost on restart.
// Amounts are major units (14.95 = 14,95 EUR), like Medusa v2.

import fs from "node:fs";
import http from "node:http";

const PORT = Number(process.env.PORT || 9000);
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const DIR = new URL(".", import.meta.url).pathname;
const CURRENCY = "eur";
const TAX_RATE = 0.19; // prices are gross (tax included), as in DE

// ---------------------------------------------------------------- catalog

const REGION = {
  id: "reg_de",
  name: "Deutschland",
  currency_code: CURRENCY,
  automatic_taxes: true,
  countries: [
    { iso_2: "de", iso_3: "deu", name: "Germany", display_name: "Germany" },
  ],
};

const CATEGORIES = {
  growkits: { id: "pcat_growkits", handle: "growkits", name: "Growkits" },
  tinkturen: { id: "pcat_tinkturen", handle: "tinkturen", name: "Tinkturen" },
};

const img = (name) => `${PUBLIC_URL}/img/${name}.jpg`;

/** Build a product. variants: [[title, price, stock?]]; with >1 variant the option is "Größe", else Medusa's "Default option". */
function makeProduct({
  key,
  title,
  handle,
  cat,
  image,
  description,
  latin,
  metadata = {},
  variants,
}) {
  const id = `prod_${key}`;
  const multi = variants.length > 1;
  // Medusa always gives a product at least one option ("Default option" for single-variant products)
  const option = {
    id: `opt_${key}`,
    title: multi ? "Größe" : "Default option",
    product_id: id,
    values: variants.map(([t], i) => ({
      id: `optval_${key}_${i}`,
      value: multi ? t : "Default option value",
      option_id: `opt_${key}`,
    })),
  };
  const product = {
    id,
    handle,
    title,
    subtitle: latin ?? null,
    description,
    status: "published",
    thumbnail: img(image),
    images: [
      { id: `img_${key}_1`, url: img(image) },
      { id: `img_${key}_2`, url: img(image === "a" ? "b" : "a") },
    ],
    categories: [CATEGORIES[cat]],
    collection_id: null,
    type: null,
    tags: [],
    metadata,
    material: null,
    origin_country: null,
    weight: null,
    length: null,
    width: null,
    height: null,
    options: option ? [option] : [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
  product.variants = variants.map(([vtitle, price, stock = 25], i) => ({
    id: `variant_${key}_${i}`,
    product_id: id,
    title: vtitle,
    sku: `${key.toUpperCase()}-${i + 1}`,
    manage_inventory: true,
    allow_backorder: false,
    inventory_quantity: stock,
    options: [
      {
        id: option.values[i].id,
        value: option.values[i].value,
        option_id: option.id,
      },
    ],
    calculated_price: {
      id: `cprice_${key}_${i}`,
      calculated_amount: price,
      original_amount: price,
      currency_code: CURRENCY,
      is_calculated_price_tax_inclusive: true,
      calculated_price: {
        id: `price_${key}_${i}`,
        price_list_id: null,
        price_list_type: null,
      },
      original_price: {
        id: `price_${key}_${i}`,
        price_list_id: null,
        price_list_type: null,
      },
    },
  }));
  return product;
}

const PRODUCTS = [
  makeProduct({
    key: "rosenseitling",
    title: "Rosenseitling Growkit",
    handle: "rosenseitling-growkit",
    cat: "growkits",
    image: "a",
    latin: "Pleurotus djamor",
    description:
      "Pinke Rosenseitlinge zum Selbstziehen: Box öffnen, wässern, Fruchtkörper ernten. Wächst bei Zimmertemperatur und ist in rund zwei Wochen erntereif.",
    metadata: {
      latin_name: "Pleurotus djamor",
      inhalt: "Fertig durchwachsener Substratblock in Anzuchtbox",
      pflege:
        "Zweimal täglich mit Wasser einsprühen, hell aber ohne direkte Sonne.",
    },
    variants: [["Standard", 14.95]],
  }),
  makeProduct({
    key: "lionsmane",
    title: "Lion's Mane Growkit",
    handle: "lions-mane-growkit",
    cat: "growkits",
    image: "b",
    latin: "Hericium erinaceus",
    description:
      "Igelstachelbart zum Selbstziehen. Wächst als weißer Pom-Pom und schmeckt nussig-mild, ähnlich wie Krabbenfleisch.",
    metadata: {
      latin_name: "Hericium erinaceus",
      inhalt: "Fertig durchwachsener Substratblock in Anzuchtbox",
      pflege: "Feucht und kühl halten, nicht direkt anbrausen.",
    },
    variants: [["Standard", 19.95]],
  }),
  makeProduct({
    key: "whitepearl",
    title: "White Pearl Growkit",
    handle: "white-pearl-growkit",
    cat: "growkits",
    image: "c",
    latin: "Pleurotus ostreatus",
    description:
      "Weißer Austernseitling in perlmuttfarbenen Büscheln. Der Klassiker für den Einstieg: robust, ertragreich und schnell.",
    metadata: {
      latin_name: "Pleurotus ostreatus",
      inhalt: "Fertig durchwachsener Substratblock in Anzuchtbox",
      pflege: "Täglich sprühen, für frische Luft sorgen.",
    },
    variants: [["Standard", 14.95]],
  }),
  makeProduct({
    key: "lm-tinktur",
    title: "Lion's Mane Tinktur",
    handle: "lions-mane-tinktur",
    cat: "tinkturen",
    image: "c",
    latin: "Hericium erinaceus",
    description:
      "Doppelextrakt aus Lion's Mane (Wasser und Alkohol). Täglich tropfenweise in Wasser oder Tee.",
    metadata: { latin_name: "Hericium erinaceus" },
    variants: [
      ["30 ml", 24.95],
      ["60 ml", 39.95],
    ],
  }),
  makeProduct({
    key: "reishi-cordyceps",
    title: "Reishi + Cordyceps Tinktur",
    handle: "reishi-cordyceps-tinktur",
    cat: "tinkturen",
    image: "a",
    latin: "Ganoderma lucidum / Cordyceps militaris",
    description:
      "Kombi-Doppelextrakt aus Reishi und Cordyceps. Für Abend- und Morgenroutine, 30 ml reichen etwa einen Monat.",
    metadata: { latin_name: "Ganoderma lucidum / Cordyceps militaris" },
    variants: [["30 ml", 29.95]],
  }),
];

const ALL_VARIANTS = new Map(); // variant id -> variant (with product backref set lazily)
for (const p of PRODUCTS) for (const v of p.variants) ALL_VARIANTS.set(v.id, v);

const SHIPPING_OPTIONS = [
  {
    id: "so_standard",
    name: "Standardversand (DHL)",
    price_type: "flat",
    amount: 4.9,
    calculated_price: { calculated_amount: 4.9 },
    service_zone_id: "serzo_de",
    provider_id: "manual_manual",
    data: null,
    type: { id: "sotype_std", label: "Standard", code: "standard" },
  },
  {
    id: "so_express",
    name: "Expressversand",
    price_type: "flat",
    amount: 9.9,
    calculated_price: { calculated_amount: 9.9 },
    service_zone_id: "serzo_de",
    provider_id: "manual_manual",
    data: null,
    type: { id: "sotype_exp", label: "Express", code: "express" },
  },
  {
    id: "so_pickup",
    name: "Abholung in Leipzig",
    price_type: "flat",
    amount: 0,
    calculated_price: { calculated_amount: 0 },
    service_zone_id: "serzo_de",
    provider_id: "manual_manual",
    data: null,
    type: { id: "sotype_pick", label: "Abholung", code: "pickup" },
  },
];

const PAYMENT_PROVIDERS = [
  { id: "pp_sumup_sumup" },
  { id: "pp_system_default" },
];

// ------------------------------------------------------------------ state

const carts = new Map();
const orders = new Map();
let seq = 0;
let displayId = 0;
const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${(++seq).toString(36).toUpperCase().padStart(4, "0")}`;
const now = () => new Date().toISOString();
const round = (n) => Math.round(n * 100) / 100;

class HttpError extends Error {
  constructor(status, message, type = "invalid_data") {
    super(message);
    this.status = status;
    this.type = type;
  }
}

// ---------------------------------------------------------------- helpers

function productOfVariant(variant) {
  return PRODUCTS.find((p) => p.id === variant.product_id);
}

/** Variant as embedded in a line item (variant.product with images/thumbnail). */
function lineVariant(variant) {
  const product = productOfVariant(variant);
  const { variants: _omit, ...productBase } = product;
  return { ...variant, product: productBase };
}

/** Recompute line items + all totals; mutates and returns the cart. */
function recalc(cart) {
  for (const item of cart.items) {
    item.subtotal =
      item.total =
      item.original_total =
        round(item.unit_price * item.quantity);
    item.tax_total = round((item.total * TAX_RATE) / (1 + TAX_RATE));
    item.updated_at = now();
  }
  for (const m of cart.shipping_methods) {
    m.total = m.subtotal = m.amount;
    m.tax_total = round((m.amount * TAX_RATE) / (1 + TAX_RATE));
  }
  const itemTotal = round(cart.items.reduce((s, i) => s + i.total, 0));
  const shippingTotal = round(
    cart.shipping_methods.reduce((s, m) => s + m.amount, 0),
  );
  const total = round(itemTotal + shippingTotal);
  cart.item_total = itemTotal;
  cart.item_subtotal = itemTotal;
  cart.shipping_total = shippingTotal;
  cart.shipping_subtotal = shippingTotal;
  cart.discount_total = 0;
  cart.subtotal = itemTotal; // gross, matches what the storefront shows as "Zwischensumme"
  cart.total = total;
  cart.original_total = total;
  cart.tax_total = round((total * TAX_RATE) / (1 + TAX_RATE));
  cart.gift_card_total = 0;
  cart.updated_at = now();
  return cart;
}

function newCart(body = {}) {
  const cart = {
    id: uid("cart"),
    region_id: body.region_id || REGION.id,
    region: REGION,
    currency_code: CURRENCY,
    email: body.email ?? null,
    customer_id: null,
    sales_channel_id: "sc_default",
    shipping_address: null,
    billing_address: null,
    items: [],
    shipping_methods: [],
    payment_collection: null,
    promotions: [],
    metadata: null,
    completed_at: null,
    created_at: now(),
    updated_at: now(),
  };
  carts.set(cart.id, cart);
  return recalc(cart);
}

const getCart = (id) => {
  const cart = carts.get(id);
  if (!cart)
    throw new HttpError(404, `Cart with id: ${id} was not found`, "not_found");
  return cart;
};

function address(a, prev) {
  if (!a) return prev ?? null;
  return {
    id: prev?.id ?? uid("caaddr"),
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    postal_code: "",
    province: "",
    phone: "",
    country_code: "de",
    ...prev,
    ...a,
  };
}

function addLineItem(cart, variantId, quantity) {
  const variant = ALL_VARIANTS.get(variantId);
  if (!variant)
    throw new HttpError(400, `Variant with id: ${variantId} was not found`);
  const product = productOfVariant(variant);
  const existing = cart.items.find((i) => i.variant_id === variantId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      id: uid("cali"),
      cart_id: cart.id,
      title: variant.title === "Standard" ? product.title : product.title,
      subtitle: variant.title,
      product_title: product.title,
      product_handle: product.handle,
      product_id: product.id,
      variant_id: variant.id,
      variant_title: variant.title,
      variant_sku: variant.sku,
      thumbnail: product.thumbnail,
      quantity,
      unit_price: variant.calculated_price.calculated_amount,
      is_tax_inclusive: true,
      requires_shipping: true,
      variant: lineVariant(variant),
      created_at: now(),
    });
  }
}

/** Keep shipping methods valid and the payment collection amount in sync. */
function syncDerived(cart) {
  recalc(cart);
  if (cart.payment_collection) {
    cart.payment_collection.amount = cart.total;
    for (const s of cart.payment_collection.payment_sessions)
      s.amount = cart.total;
  }
  return cart;
}

function orderFromCart(cart) {
  const order = {
    id: uid("order"),
    display_id: ++displayId,
    status: "pending",
    version: 1,
    region_id: cart.region_id,
    currency_code: cart.currency_code,
    email: cart.email,
    customer_id: null,
    sales_channel_id: cart.sales_channel_id,
    items: cart.items.map((i) => ({
      ...i,
      id: uid("ordli"),
      order_id: undefined,
    })),
    shipping_address: cart.shipping_address,
    billing_address: cart.billing_address ?? cart.shipping_address,
    shipping_methods: cart.shipping_methods.map((m) => ({
      ...m,
      id: uid("ordsm"),
    })),
    payment_collections: cart.payment_collection
      ? [
          {
            ...cart.payment_collection,
            status: "authorized",
            payment_sessions: cart.payment_collection.payment_sessions.map(
              (s) => ({ ...s, status: "authorized" }),
            ),
          },
        ]
      : [],
    payment_status: "authorized",
    fulfillment_status: "not_fulfilled",
    metadata: null,
    created_at: now(),
    updated_at: now(),
  };
  for (const k of [
    "item_total",
    "item_subtotal",
    "shipping_total",
    "shipping_subtotal",
    "discount_total",
    "subtotal",
    "total",
    "original_total",
    "tax_total",
    "gift_card_total",
  ])
    order[k] = cart[k];
  orders.set(order.id, order);
  return order;
}

// --------------------------------------------------------------- products

function listProducts(q) {
  let list = PRODUCTS;
  const all = (k) =>
    q
      .getAll(k)
      .concat(q.getAll(`${k}[]`))
      .flatMap((v) => v.split(","));
  const ids = all("id");
  const handles = all("handle");
  const cats = all("category_id");
  if (ids.length) list = list.filter((p) => ids.includes(p.id));
  if (handles.length) list = list.filter((p) => handles.includes(p.handle));
  if (cats.length)
    list = list.filter((p) =>
      p.categories.some((c) => cats.includes(c.id) || cats.includes(c.handle)),
    );
  const count = list.length;
  const offset = Number(q.get("offset") || 0);
  const limit = Number(q.get("limit") || 50);
  return { products: list.slice(offset, offset + limit), count, offset, limit };
}

// ----------------------------------------------------------------- router

/** Returns [status, body]. `p` = path segments after /store, `q` = URLSearchParams. */
function route(method, path, q, body) {
  const m = (pattern) => {
    const re = new RegExp(
      "^" + pattern.replace(/:[a-z_]+/g, "([^/]+)") + "/?$",
    );
    const r = re.exec(path);
    return r ? r.slice(1).map(decodeURIComponent) : null;
  };
  let a;

  if (method === "GET" && path === "/health") return [200, { ok: true }];

  // regions
  if (method === "GET" && path === "/store/regions")
    return [200, { regions: [REGION], count: 1, offset: 0, limit: 50 }];
  if (method === "GET" && (a = m("/store/regions/:id")))
    return [200, { region: REGION }];

  // catalog
  if (method === "GET" && path === "/store/products")
    return [200, listProducts(q)];
  if (method === "GET" && (a = m("/store/products/:id"))) {
    const product = PRODUCTS.find((p) => p.id === a[0] || p.handle === a[0]);
    if (!product)
      throw new HttpError(
        404,
        `Product with id: ${a[0]} was not found`,
        "not_found",
      );
    return [200, { product }];
  }
  if (method === "GET" && path === "/store/product-categories") {
    const product_categories = Object.values(CATEGORIES).map((c) => ({
      ...c,
      parent_category_id: null,
      category_children: [],
    }));
    return [
      200,
      {
        product_categories,
        count: product_categories.length,
        offset: 0,
        limit: 50,
      },
    ];
  }
  if (method === "GET" && path === "/store/components")
    return [200, { components: [], count: 0 }];

  // carts
  if (method === "POST" && path === "/store/carts")
    return [200, { cart: newCart(body) }];
  if (method === "GET" && (a = m("/store/carts/:id")))
    return [200, { cart: getCart(a[0]) }];
  if (method === "POST" && (a = m("/store/carts/:id"))) {
    const cart = getCart(a[0]);
    if (body.email !== undefined) cart.email = body.email;
    if (body.shipping_address)
      cart.shipping_address = address(
        body.shipping_address,
        cart.shipping_address,
      );
    if (body.billing_address)
      cart.billing_address = address(
        body.billing_address,
        cart.billing_address,
      );
    if (body.metadata) cart.metadata = { ...cart.metadata, ...body.metadata };
    return [200, { cart: syncDerived(cart) }];
  }
  if (method === "POST" && (a = m("/store/carts/:id/line-items"))) {
    const cart = getCart(a[0]);
    if (cart.completed_at)
      throw new HttpError(400, "Cart is already completed");
    addLineItem(cart, body.variant_id, Number(body.quantity) || 1);
    return [200, { cart: syncDerived(cart) }];
  }
  if (method === "POST" && (a = m("/store/carts/:id/line-items/:lid"))) {
    const cart = getCart(a[0]);
    const item = cart.items.find((i) => i.id === a[1]);
    if (!item)
      throw new HttpError(
        404,
        `Line item with id: ${a[1]} was not found`,
        "not_found",
      );
    item.quantity = Math.max(1, Number(body.quantity) || 1);
    return [200, { cart: syncDerived(cart) }];
  }
  if (method === "DELETE" && (a = m("/store/carts/:id/line-items/:lid"))) {
    const cart = getCart(a[0]);
    cart.items = cart.items.filter((i) => i.id !== a[1]);
    if (!cart.items.length) cart.shipping_methods = [];
    syncDerived(cart);
    return [
      200,
      { id: a[1], object: "line-item", deleted: true, parent: cart },
    ];
  }
  if (method === "POST" && (a = m("/store/carts/:id/shipping-methods"))) {
    const cart = getCart(a[0]);
    const option = SHIPPING_OPTIONS.find((o) => o.id === body.option_id);
    if (!option)
      throw new HttpError(
        400,
        `Shipping option with id: ${body.option_id} not found`,
      );
    cart.shipping_methods = [
      {
        id: uid("casm"),
        cart_id: cart.id,
        name: option.name,
        amount: option.amount,
        is_tax_inclusive: true,
        shipping_option_id: option.id,
        data: body.data ?? null,
        created_at: now(),
      },
    ];
    return [200, { cart: syncDerived(cart) }];
  }
  if (method === "POST" && (a = m("/store/carts/:id/complete"))) {
    const cart = getCart(a[0]);
    if (cart.completed_at) {
      const existing = [...orders.values()].find((o) => o.cart_id === cart.id);
      return [200, { type: "order", order: existing }];
    }
    const missing = !cart.items.length
      ? "Cart has no items"
      : !cart.email || !cart.shipping_address
        ? "Email and shipping address are required"
        : !cart.shipping_methods.length
          ? "No shipping method selected"
          : !cart.payment_collection?.payment_sessions.length
            ? "No payment session initiated"
            : null;
    if (missing) {
      return [
        400,
        {
          type: "cart",
          cart,
          error: {
            message: missing,
            name: "invalid_data",
            type: "invalid_data",
          },
        },
      ];
    }
    const order = orderFromCart(syncDerived(cart));
    order.cart_id = cart.id;
    cart.completed_at = now();
    return [200, { type: "order", order }];
  }

  // checkout lookups
  if (method === "GET" && path === "/store/shipping-options") {
    const cart = q.get("cart_id") ? getCart(q.get("cart_id")) : null;
    // Pickup only offered for orders without a far shipping address, kept simple: always offered.
    void cart;
    return [200, { shipping_options: SHIPPING_OPTIONS }];
  }
  if (method === "GET" && path === "/store/payment-providers") {
    return [
      200,
      {
        payment_providers: PAYMENT_PROVIDERS,
        count: PAYMENT_PROVIDERS.length,
        offset: 0,
        limit: 50,
      },
    ];
  }

  // payment collection + sessions (sdk.store.payment.initiatePaymentSession)
  if (method === "POST" && path === "/store/payment-collections") {
    const cart = getCart(body.cart_id);
    cart.payment_collection ??= {
      id: uid("paycol"),
      currency_code: cart.currency_code,
      amount: cart.total,
      status: "not_paid",
      payment_sessions: [],
    };
    return [200, { payment_collection: cart.payment_collection }];
  }
  if (
    method === "POST" &&
    (a = m("/store/payment-collections/:id/payment-sessions"))
  ) {
    const cart = [...carts.values()].find(
      (c) => c.payment_collection?.id === a[0],
    );
    if (!cart)
      throw new HttpError(
        404,
        `Payment collection with id: ${a[0]} was not found`,
        "not_found",
      );
    const provider = PAYMENT_PROVIDERS.find((p) => p.id === body.provider_id);
    if (!provider)
      throw new HttpError(
        400,
        `Payment provider ${body.provider_id} is not enabled`,
      );
    const col = cart.payment_collection;
    const id = uid("payses");
    // Replaces earlier sessions, as Medusa does when the provider changes.
    col.payment_sessions = [
      {
        id,
        provider_id: provider.id,
        status: "pending",
        amount: cart.total,
        currency_code: cart.currency_code,
        // SumUp: the widget reads data.id as checkout id. A fake id means the
        // real SumUp card widget cannot actually pay; use pp_system_default.
        data: provider.id.startsWith("pp_sumup")
          ? { id: `mock-sumup-checkout-${id}`, status: "PENDING", ...body.data }
          : { ...body.data },
        payment_collection_id: col.id,
      },
    ];
    return [200, { payment_collection: col }];
  }

  // orders
  if (method === "GET" && (a = m("/store/orders/:id"))) {
    const order = orders.get(a[0]);
    if (!order)
      throw new HttpError(
        404,
        `Order with id: ${a[0]} was not found`,
        "not_found",
      );
    return [200, { order }];
  }

  // custom: Widerruf
  if (method === "POST" && path === "/store/withdrawals") {
    for (const k of ["name", "email", "order_reference"]) {
      if (!body?.[k]) throw new HttpError(400, `${k} is required`);
    }
    return [
      200,
      {
        withdrawal: {
          id: uid("wd"),
          received_at: now(),
          name: body.name,
          email: body.email,
          order_reference: body.order_reference,
        },
      },
    ];
  }

  return null;
}

// ----------------------------------------------------------------- server

http
  .createServer(async (req, res) => {
    const origin = req.headers.origin;
    res.setHeader("access-control-allow-origin", origin || "*");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader(
      "access-control-allow-methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.setHeader(
      "access-control-allow-headers",
      req.headers["access-control-request-headers"] || "*",
    );
    res.setHeader("access-control-max-age", "600");
    res.setHeader("vary", "Origin");

    const url = new URL(req.url, "http://x");
    console.log(
      `${req.method} ${url.pathname}${url.search ? " ?" + decodeURIComponent(url.search.slice(1)).slice(0, 120) : ""}`,
    );

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    if (url.pathname.startsWith("/img/")) {
      const file = DIR + url.pathname.slice(5).replace(/[^\w.-]/g, "");
      if (!fs.existsSync(file)) {
        res.statusCode = 404;
        return res.end();
      }
      res.setHeader("content-type", "image/jpeg");
      res.setHeader("cache-control", "public, max-age=3600");
      return res.end(fs.readFileSync(file));
    }

    let raw = "";
    for await (const chunk of req) raw += chunk;
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      /* ignore bad json */
    }

    res.setHeader("content-type", "application/json");
    try {
      const result = route(
        req.method,
        url.pathname.replace(/\/+$/, "") || "/",
        url.searchParams,
        body,
      );
      if (!result) {
        res.statusCode = 404;
        return res.end(
          JSON.stringify({
            type: "not_found",
            message: `Not implemented in mock: ${req.method} ${url.pathname}`,
          }),
        );
      }
      res.statusCode = result[0];
      res.end(JSON.stringify(result[1]));
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      res.statusCode = e.status || 500;
      res.end(
        JSON.stringify({
          type: e.type || "unexpected_state",
          message: e.message,
        }),
      );
    }
  })
  .listen(PORT, () =>
    console.log(`mock-medusa listening on :${PORT} (images via ${PUBLIC_URL})`),
  );
