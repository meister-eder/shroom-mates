import {
  $cart,
  $isCartLoading,
  removeFromCart,
  updateLineItemQuantity,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { QtyStepper } from "@modules/common/components/QtyStepper";
import { useStore } from "@nanostores/react";
import { useState } from "react";

interface CartPageProps {
  countryCode: string;
}

export const CartPage = ({ countryCode }: CartPageProps) => {
  const cart = useStore($cart);
  const isCartLoading = useStore($isCartLoading);
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (lineItemId: string, action: () => Promise<void>) => {
    setBusyId(lineItemId);
    try {
      await action();
    } catch (error) {
      console.error("Failed to update cart:", error);
    } finally {
      setBusyId(null);
    }
  };

  const itemCount = cart?.items?.length ?? 0;
  const isEmpty = itemCount === 0;

  if (!cart && isCartLoading) {
    return <p className="page-note">Pilzkorb wird geladen…</p>;
  }
  const currencyCode = cart?.currency_code || "EUR";

  const discountTotal = cart?.discount_total ?? 0;

  return (
    <div className="shop-page">
      {isEmpty ? (
        <div className="cartpage-empty">
          <MatesEyes size={180} alt="" className="shop-eyes" />
          <h1 className="shop-h1 shop-h1--sm">Hier wächst noch nichts.</h1>
          <p>Die Mates langweilen sich.</p>
          <a href={`/${countryCode}/store`} className="btn btn--primary">
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
                const busy = busyId === item.id;

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
                          disabled={busy}
                          decreaseLabel={
                            quantity <= 1
                              ? `${productTitle} entfernen`
                              : "Menge verringern"
                          }
                          onDecrease={() =>
                            run(item.id, () =>
                              updateLineItemQuantity(item.id, quantity - 1),
                            )
                          }
                          onIncrease={() =>
                            run(item.id, () =>
                              updateLineItemQuantity(item.id, quantity + 1),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            run(item.id, () => removeFromCart(item.id))
                          }
                          disabled={busy}
                          className="text-btn cartpage-remove"
                          aria-label={`${productTitle} aus dem Pilzkorb entfernen`}
                        >
                          Entfernen
                        </button>
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
                href={`/${countryCode}/checkout`}
                className="btn btn--primary btn--block cartpage-checkout"
              >
                Zur Kasse
              </a>
              <a href={`/${countryCode}/store`} className="cartpage-continue">
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
