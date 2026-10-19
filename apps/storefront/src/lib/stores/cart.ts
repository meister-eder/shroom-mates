import { sdk } from "@lib/sdk";
import type { StoreCart, StoreOrder } from "@medusajs/types";
import { atom, computed } from "nanostores";

const CART_FIELDS =
  "*items,*items.variant,*items.variant.product,*items.variant.product.images,*items.variant.product.thumbnail,*shipping_address,*billing_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions";

// Cart state atom
export const $cart = atom<StoreCart | null>(null);

// True until the first cart load on this page has finished
export const $isCartLoading = atom<boolean>(true);

// Sidebar visibility atom
export const $isCartSidebarOpen = atom<boolean>(false);

// Current region ID atom (set server-side, used client-side)
export const $regionId = atom<string | null>(null);

// Header count shown before the cart request returns (full-page navigations
// drop the in-memory cart): { id, count } mirrored to sessionStorage.
const CART_SNAPSHOT_KEY = "cart_snapshot";

function readSnapshot(): { id: string; count: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CART_SNAPSHOT_KEY);
    const snap = raw ? JSON.parse(raw) : null;
    if (
      snap &&
      typeof snap.id === "string" &&
      typeof snap.count === "number" &&
      snap.id === localStorage.getItem("cart_id")
    ) {
      return snap;
    }
  } catch {
    // unreadable snapshot: ignore
  }
  return null;
}

const $cartSnapshot = atom<{ id: string; count: number } | null>(
  readSnapshot(),
);

// Computed cart item count (snapshot until the cart has loaded)
export const $cartItemCount = computed(
  [$cart, $cartSnapshot],
  (cart, snapshot) => {
    if (!cart) return snapshot?.count ?? 0;
    if (!cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  },
);

if (typeof window !== "undefined") {
  $cart.listen((cart) => {
    try {
      if (!cart) {
        sessionStorage.removeItem(CART_SNAPSHOT_KEY);
        return;
      }
      const count = (cart.items ?? []).reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );
      sessionStorage.setItem(
        CART_SNAPSHOT_KEY,
        JSON.stringify({ id: cart.id, count }),
      );
    } catch {
      // storage unavailable: the snapshot is only an optimisation
    }
  });
}

// Cart ID storage key
const CART_ID_KEY = "cart_id";

/**
 * Get cart ID from localStorage
 */
export function getCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_ID_KEY);
}

/**
 * Save cart ID to localStorage
 */
function saveCartId(cartId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_ID_KEY, cartId);
}

/**
 * Clear cart ID from localStorage
 */
function clearCartId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_ID_KEY);
}

// The cart a payment was started for. Kept separately from CART_ID_KEY so the
// payment-redirect landing page can still complete it after initCart() has
// swapped in a fresh cart (e.g. because the webhook already completed it).
const CHECKOUT_CART_ID_KEY = "checkout_cart_id";

/**
 * The cart a payment was started for, or null. Deliberately no fallback to
 * the browsing cart: the redirect landing page must never complete a cart the
 * customer didn't pay for (e.g. when the URL is opened directly).
 */
export function getCheckoutCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CHECKOUT_CART_ID_KEY);
}

// Shared in-flight init so several islands calling initCart() on the same
// page trigger only one request.
let initPromise: Promise<void> | null = null;

/**
 * Initialize cart - check localStorage for existing cart or create new one.
 * Safe to call repeatedly: concurrent calls share one request and an already
 * loaded cart for the current region is reused.
 */
export function initCart(): Promise<void> {
  const loaded = $cart.get();
  if (
    loaded &&
    loaded.id === getCartId() &&
    loaded.region_id === $regionId.get()
  ) {
    $isCartLoading.set(false);
    return Promise.resolve();
  }
  initPromise ??= loadCart().finally(() => {
    initPromise = null;
    $isCartLoading.set(false);
  });
  return initPromise;
}

async function loadCart(): Promise<void> {
  try {
    const regionId = $regionId.get();
    if (!regionId) {
      console.warn("Region ID not set, cannot initialize cart");
      return;
    }

    const baseUrl = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL;

    if (!baseUrl) {
      console.error(
        "Medusa SDK baseUrl is not configured. Please set PUBLIC_MEDUSA_BACKEND_URL environment variable.",
      );
      return;
    }

    const existingCartId = getCartId();

    if (existingCartId) {
      // Try to retrieve existing cart
      try {
        const { cart } = await sdk.store.cart.retrieve(existingCartId, {
          fields: CART_FIELDS,
        });
        // A cart completed by the payment webhook can't be reused.
        if (!cart.completed_at) {
          $cart.set(cart);
          return;
        }
        clearCartId();
      } catch (error) {
        // Cart doesn't exist or is invalid, create new one
        console.warn(
          "Failed to retrieve existing cart, creating new one:",
          error,
        );
        clearCartId();
      }
    }

    // Create new cart
    const { cart } = await sdk.store.cart.create(
      {
        region_id: regionId,
      },
      {
        fields: CART_FIELDS,
      },
    );

    $cart.set(cart);
    saveCartId(cart.id);
  } catch (error) {
    console.error("Failed to initialize cart:", error);
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  variantId: string,
  quantity: number,
  { openSidebar = true }: { openSidebar?: boolean } = {},
): Promise<void> {
  try {
    // Ensure cart exists
    if (!$cart.get()) {
      await initCart();
    }

    const cart = $cart.get();
    if (!cart) {
      throw new Error("Cart not initialized");
    }

    // Add line item
    const { cart: updatedCart } = await sdk.store.cart.createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {
        fields: CART_FIELDS,
      },
    );

    $cart.set(updatedCart);
    // Open sidebar after adding item (callers with their own feedback opt out)
    if (openSidebar) $isCartSidebarOpen.set(true);
  } catch (error) {
    console.error("Failed to add item to cart:", error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(lineItemId: string): Promise<void> {
  try {
    const cart = $cart.get();
    if (!cart) {
      throw new Error("Cart not initialized");
    }

    await sdk.store.cart.deleteLineItem(cart.id, lineItemId, {
      fields: CART_FIELDS,
    });

    // Retrieve updated cart (deleteLineItem returns parent but it might be undefined)
    const { cart: updatedCart } = await sdk.store.cart.retrieve(cart.id, {
      fields: CART_FIELDS,
    });

    $cart.set(updatedCart);
  } catch (error) {
    console.error("Failed to remove item from cart:", error);
    throw error;
  }
}

/**
 * Update line item quantity
 */
export async function updateLineItemQuantity(
  lineItemId: string,
  quantity: number,
): Promise<void> {
  try {
    const cart = $cart.get();
    if (!cart) {
      throw new Error("Cart not initialized");
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await removeFromCart(lineItemId);
      return;
    }

    const { cart: updatedCart } = await sdk.store.cart.updateLineItem(
      cart.id,
      lineItemId,
      {
        quantity,
      },
      {
        fields: CART_FIELDS,
      },
    );

    $cart.set(updatedCart);
  } catch (error) {
    console.error("Failed to update line item quantity:", error);
    throw error;
  }
}

/**
 * Toggle cart sidebar
 */
export function toggleCartSidebar(): void {
  $isCartSidebarOpen.set(!$isCartSidebarOpen.get());
}

/**
 * Close cart sidebar
 */
export function closeCartSidebar(): void {
  $isCartSidebarOpen.set(false);
}

/**
 * Open cart sidebar
 */
export function openCartSidebar(): void {
  $isCartSidebarOpen.set(true);
}

/**
 * Add shipping method to cart
 */
export async function addShippingMethod(
  shippingOptionId: string,
): Promise<void> {
  const cart = $cart.get();
  if (!cart) {
    throw new Error("Cart not initialized");
  }

  const { cart: updatedCart } = await sdk.store.cart.addShippingMethod(
    cart.id,
    { option_id: shippingOptionId },
    {
      fields: CART_FIELDS,
    },
  );

  $cart.set(updatedCart);
}

/**
 * Initiate a payment session for the cart
 */
export async function initPaymentSession(
  providerId: string,
  options: { redirectUrl?: string } = {},
): Promise<void> {
  const cart = $cart.get();
  if (!cart) {
    throw new Error("Cart not initialized");
  }

  const description = cart.items
    ?.map((item) => `${item.quantity}× ${item.title}`)
    .join(", ");

  const addr = cart.shipping_address;
  const customerData: Record<string, string> = {};
  if (cart.email) customerData.email = cart.email;
  if (addr?.first_name) customerData.first_name = addr.first_name;
  if (addr?.last_name) customerData.last_name = addr.last_name;

  await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: providerId,
    data: {
      ...(description && { description }),
      ...customerData,
      // Where SumUp sends the buyer after 3DS / APM payments. The provider
      // only honours hosts on its allow-list.
      ...(options.redirectUrl && { redirect_url: options.redirectUrl }),
    },
  });

  localStorage.setItem(CHECKOUT_CART_ID_KEY, cart.id);

  const { cart: updatedCart } = await sdk.store.cart.retrieve(cart.id, {
    fields: CART_FIELDS,
  });

  $cart.set(updatedCart);
}

export type PlaceOrderResult =
  | { type: "order"; order: StoreOrder }
  // Payment was not authorized (declined, cancelled, or not yet confirmed).
  | { type: "payment_failed"; message: string }
  // Another request (usually the payment webhook) is still completing the
  // cart; the outcome is unknown.
  | { type: "pending" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Complete the cart and place the order.
 *
 * Only reports success when Medusa returns an order. Completing an already
 * completed cart returns the existing order, so a 409 ("being completed by
 * another request", e.g. the SumUp webhook) is retried rather than treated
 * as success. `pendingPaymentRetries` additionally retries while the payment
 * provider has not confirmed the payment yet (redirect flows).
 */
export async function placeOrder(
  cartId: string | null = $cart.get()?.id ?? getCartId(),
  { conflictRetries = 5, pendingPaymentRetries = 0 } = {},
): Promise<PlaceOrderResult> {
  if (!cartId) {
    throw new Error("Cart not initialized");
  }

  let conflicts = 0;
  let pending = 0;

  for (;;) {
    try {
      const result = await sdk.store.cart.complete(cartId);

      if (result.type === "order") {
        localStorage.removeItem(CHECKOUT_CART_ID_KEY);
        if (getCartId() === cartId) clearCartId();
        if ($cart.get()?.id === cartId) $cart.set(null);
        return { type: "order", order: result.order };
      }

      if (pending < pendingPaymentRetries) {
        pending++;
        await sleep(1500 * pending);
        continue;
      }
      return {
        type: "payment_failed",
        message: result.error?.message ?? "",
      };
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      if (status === 409 && conflicts < conflictRetries) {
        conflicts++;
        await sleep(1000 * conflicts);
        continue;
      }
      if (status === 409) return { type: "pending" };
      throw error;
    }
  }
}

/**
 * Update cart shipping address and email
 */
type CartAddress = {
  first_name: string;
  last_name: string;
  address_1: string;
  company?: string;
  postal_code: string;
  city: string;
  country_code: string;
  province?: string;
  phone?: string;
};

export async function updateCartAddress(data: {
  email: string;
  shipping_address: CartAddress;
  billing_address?: CartAddress;
}): Promise<void> {
  const cart = $cart.get();
  if (!cart) {
    throw new Error("Cart not initialized");
  }

  const { cart: updatedCart } = await sdk.store.cart.update(cart.id, data, {
    fields: CART_FIELDS,
  });

  $cart.set(updatedCart);
}
