/**
 * Thin typed fetch wrapper for the Medusa Store API, used in the browser
 * instead of @medusajs/js-sdk (keeps the SDK out of the client bundle).
 * Server-side code (lib/data, middleware) keeps using the SDK in lib/sdk.ts.
 * Covers exactly the calls the client islands make.
 */
import type {
  StoreCart,
  StoreCartResponse,
  StoreCartShippingOptionWithServiceZone,
  StoreCompleteCartResponse,
  StorePaymentProvider,
  StoreProduct,
} from "@medusajs/types";

const BASE_URL = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL as string;
const PUBLISHABLE_KEY = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY as
  | string
  | undefined;

export class StoreApiError extends Error {
  status: number;
  statusText: string;
  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "StoreApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

type Query = Record<string, string | number | boolean | undefined>;

async function request<T>(
  path: string,
  {
    method = "GET",
    query,
    body,
  }: { method?: string; query?: Query; body?: unknown } = {},
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

  const res = await fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ""}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (typeof data?.message === "string") message = data.message;
    } catch {
      // non-JSON error body: keep the status text
    }
    throw new StoreApiError(message, res.status, res.statusText);
  }
  return (await res.json()) as T;
}

type Fields = { fields?: string };

export const storeApi = {
  cart: {
    retrieve: (id: string, query: Fields) =>
      request<StoreCartResponse>(`/store/carts/${id}`, { query }),
    create: (body: { region_id: string }, query: Fields) =>
      request<StoreCartResponse>("/store/carts", {
        method: "POST",
        body,
        query,
      }),
    update: (id: string, body: object, query: Fields) =>
      request<StoreCartResponse>(`/store/carts/${id}`, {
        method: "POST",
        body,
        query,
      }),
    createLineItem: (
      id: string,
      body: { variant_id: string; quantity: number },
      query: Fields,
    ) =>
      request<StoreCartResponse>(`/store/carts/${id}/line-items`, {
        method: "POST",
        body,
        query,
      }),
    updateLineItem: (
      id: string,
      lineId: string,
      body: { quantity: number },
      query: Fields,
    ) =>
      request<StoreCartResponse>(`/store/carts/${id}/line-items/${lineId}`, {
        method: "POST",
        body,
        query,
      }),
    deleteLineItem: (id: string, lineId: string, query: Fields) =>
      request<unknown>(`/store/carts/${id}/line-items/${lineId}`, {
        method: "DELETE",
        query,
      }),
    addShippingMethod: (
      id: string,
      body: { option_id: string },
      query: Fields,
    ) =>
      request<StoreCartResponse>(`/store/carts/${id}/shipping-methods`, {
        method: "POST",
        body,
        query,
      }),
    complete: (id: string) =>
      request<StoreCompleteCartResponse>(`/store/carts/${id}/complete`, {
        method: "POST",
      }),
  },
  product: {
    retrieve: (id: string, query: Query) =>
      request<{ product: StoreProduct }>(`/store/products/${id}`, { query }),
  },
  fulfillment: {
    listCartOptions: (query: { cart_id: string }) =>
      request<{ shipping_options: StoreCartShippingOptionWithServiceZone[] }>(
        "/store/shipping-options",
        { query },
      ),
  },
  payment: {
    listPaymentProviders: (query: { region_id: string }) =>
      request<{ payment_providers: StorePaymentProvider[] }>(
        "/store/payment-providers",
        { query },
      ),
    /** Creates the payment collection first when the cart has none. */
    initiatePaymentSession: async (
      cart: StoreCart,
      body: { provider_id: string; data?: Record<string, unknown> },
    ) => {
      let collectionId = cart.payment_collection?.id;
      if (!collectionId) {
        const { payment_collection } = await request<{
          payment_collection: { id: string };
        }>("/store/payment-collections", {
          method: "POST",
          body: { cart_id: cart.id },
        });
        collectionId = payment_collection.id;
      }
      return request<unknown>(
        `/store/payment-collections/${collectionId}/payment-sessions`,
        { method: "POST", body },
      );
    },
  },
  /** Custom routes of the shop backend. */
  withdrawals: {
    create: <T>(body: unknown) =>
      request<{ withdrawal: T }>("/store/withdrawals", {
        method: "POST",
        body,
      }),
  },
};
