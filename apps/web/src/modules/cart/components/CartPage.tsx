import {
  $cart,
  $isCartLoading,
  removeFromCart,
  updateLineItemQuantity,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import type { StoreCart } from "@medusajs/types";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { QtyStepper } from "@modules/common/components/QtyStepper";
import { useStore } from "@nanostores/react";
import { useState } from "react";
import { CartSkeleton } from "./CartSkeleton";

/** Applies a quantity change (0 removes the line) and recomputes the item total. */
const withQuantity = (
  cart: StoreCart,
  lineItemId: string,
  quantity: number,
): StoreCart => {
  const items = (cart.items ?? [])
    .map((item) => (item.id === lineItemId ? { ...item, quantity } : item))
    .filter((item) => (item.quantity ?? 0) > 0);
  const itemTotal = items.reduce(
    (sum, item) => sum + (item.unit_price ?? 0) * (item.quantity ?? 0),
    0,
  );
  return { ...cart, items, item_total: itemTotal } as StoreCart;
};

export const CartPage = () => {
  const cart = useStore($cart);
  const isCartLoading = useStore($isCartLoading);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Optimistic: the cart atom changes immediately, the request syncs in the
  // background and the previous cart is restored if it fails.
  const run = async (
    lineItemId: string,
    quantity: number,
    action: () => Promise<void>,
  ) => {
    const previous = $cart.get();
    if (!previous) return;
    setError("");
    setStatus(quantity <= 0 ? "Artikel entfernt." : "");
    $cart.set(withQuantity(previous, lineItemId, quantity));
    setPending((ids) => [...ids, lineItemId]);
    try {
      await action();
    } catch (err) {
      console.error("Failed to update cart:", err);
      $cart.set(previous);
      setStatus("");
      setError(
        "Der Pilzkorb konnte nicht aktualisiert werden. Bitte versuche es erneut.",
      );
    } finally {
      setPending((ids) => {
        const index = ids.indexOf(lineItemId);
        return ids.filter((_, i) => i !== index);
      });
    }
  };

  const itemCount = cart?.items?.length ?? 0;
  const isEmpty = itemCount === 0;

  if (!cart && isCartLoading) {
    return <CartSkeleton />;
  }
  const currencyCode = cart?.currency_code || "EUR";

  const discountTotal = cart?.discount_total ?? 0;

  return (
    <div className="shop-page">
      <output className="sr-only">{status}</output>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {isEmpty ? (
        <div className="cartpage-empty">
          <MatesEyes size={180} alt="" className="shop-eyes" />
          <h1 className="shop-h1 shop-h1--sm">Hier wächst noch nichts.</h1>
          <p>Die Mates langweilen sich.</p>
          <a href="/shop/" className="btn btn--primary">
            Zum Sortiment
          </a>
        </div>
      ) : (
        <>
          <div className="cartpage-head">
            <MatesEyes size={64} alt="" className="cartpage-eyes" />
            <h1 className="shop-h1">Dein Pilzkorb</h1>
          </div>

          <div className="shop-split">
            {/* biome-ignore lint/a11y/useSemanticElements: ARIA-Rolle bewusst gesetzt, natives Element würde Darstellung und Verhalten ändern */}
            <ul
              className="cartpage-list"
              // biome-ignore lint/a11y/noRedundantRoles: role="list" bleibt, weil list-style: none in Safari/VoiceOver die Listensemantik entfernt
              role="list"
            >
              {cart?.items?.map((item) => {
                const product = item.variant?.product;
                const thumbnailUrl =
                  item.thumbnail ||
                  product?.thumbnail ||
                  product?.images?.[0]?.url;
                const productTitle = product?.title || item.title || "Produkt";
                const variantTitle = item.variant?.title || "";
                const unitPrice = item.unit_price || 0;
                const quantity = item.quantity || 1;
                const busy = pending.includes(item.id);

                return (
                  <li key={item.id} aria-busy={busy} className="cartpage-item">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={productTitle}
                        className="cartpage-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="cartpage-thumb cartpage-thumb--empty"
                        aria-hidden="true"
                      />
                    )}
                    <div className="cartpage-body">
                      <div className="cartpage-row">
                        <p className="cartpage-title">{productTitle}</p>
                        <p className="cartpage-price">
                          {convertToLocale({
                            amount: unitPrice * quantity,
                            currencyCode,
                          })}
                        </p>
                      </div>
                      <p className="shop-meta">
                        {variantTitle && `${variantTitle} · `}
                        {convertToLocale({ amount: unitPrice, currencyCode })}
                      </p>
                      <div className="cartpage-actions">
                        <QtyStepper
                          value={quantity}
                          label={`Anzahl ${productTitle}`}
                          decreaseLabel={
                            quantity <= 1
                              ? `${productTitle} entfernen`
                              : "Menge verringern"
                          }
                          onDecrease={() =>
                            run(item.id, quantity - 1, () =>
                              updateLineItemQuantity(item.id, quantity - 1),
                            )
                          }
                          onIncrease={() =>
                            run(item.id, quantity + 1, () =>
                              updateLineItemQuantity(item.id, quantity + 1),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            run(item.id, 0, () => removeFromCart(item.id))
                          }
                          className="text-btn cartpage-remove"
                          aria-label={`${productTitle} aus dem Pilzkorb entfernen`}
                        >
                          Entfernen
                        </button>
                        {busy && (
                          <span className="cartpage-sync" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside
              aria-labelledby="cart-summary-title"
              className="shop-side shop-side--cart"
            >
              {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
              <h2 id="cart-summary-title" className="sr-only">
                Zusammenfassung
              </h2>
              <div className="cartpage-sum cartpage-sum--lg">
                <span>Zwischensumme</span>
                <span className="cartpage-sum-amount">
                  {convertToLocale({
                    amount: cart?.item_total ?? 0,
                    currencyCode,
                  })}
                </span>
              </div>
              {discountTotal > 0 && (
                <div className="cartpage-sum cartpage-sum--discount">
                  <span>Rabatt</span>
                  <span className="shop-mono">
                    −{convertToLocale({ amount: discountTotal, currencyCode })}
                  </span>
                </div>
              )}
              <p className="shop-meta">
                inkl. MwSt. · Versand wird im nächsten Schritt berechnet
              </p>
              <a
                href="/shop/checkout/"
                className="btn btn--primary btn--block cartpage-checkout"
              >
                Zur Kasse
              </a>
              <a href="/shop/" className="cartpage-continue">
                Weiter stöbern
              </a>
              <p className="shop-meta">
                Lieferung nur innerhalb Deutschlands. Bezahlung per Karte und
                weiteren Zahlarten über SumUp.
              </p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
