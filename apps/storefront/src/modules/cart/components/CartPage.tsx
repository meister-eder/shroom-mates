import {
  $cart,
  $isCartLoading,
  removeFromCart,
  updateLineItemQuantity,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import { stickerColor, stickerColorVar } from "@lib/utils/product-color";
import { useStore } from "@nanostores/react";
import { CartTotals } from "@modules/common/components/CartTotals";
import { QtyStepper } from "@modules/common/components/QtyStepper";
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

  return (
    <div className="cart-page">
      {isEmpty ? (
        <div className="cart-empty cart-empty--page">
          <img
            src="/mascot.webp"
            alt=""
            aria-hidden="true"
            width={180}
            height={180}
            className="cart-empty__mascot"
          />
          <h1 className="page-title">Dein Pilzkorb ist leer</h1>
          <p className="cart-empty__title">Hier wächst noch nichts.</p>
          <p className="cart-empty__text">Die Mates langweilen sich.</p>
          <a href={`/${countryCode}/store`} className="btn btn--primary">
            Weiter einkaufen
          </a>
        </div>
      ) : (
        <div className="cart-page__grid">
          <div>
            <h1 className="page-title">Dein Pilzkorb</h1>

            <ul className="cart-page__items" role="list">
              {cart?.items?.map((item) => {
                const product = item.variant?.product;
                const thumbnailUrl =
                  item.thumbnail || product?.thumbnail || product?.images?.[0]?.url;
                const productTitle = product?.title || item.title || "Produkt";
                const variantTitle = item.variant?.title || "";
                const unitPrice = item.unit_price || 0;
                const quantity = item.quantity || 1;
                const color = stickerColorVar(
                  stickerColor({ handle: product?.handle, title: productTitle }),
                );
                const busy = busyId === item.id;

                return (
                  <li key={item.id} className="cart-line cart-line--page" aria-busy={busy}>
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={productTitle}
                        className="cart-line__thumb"
                        style={{ borderColor: color }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="cart-line__thumb"
                        style={{ borderColor: color, background: color }}
                        aria-hidden="true"
                      />
                    )}
                    <div className="cart-line__body">
                      <div className="cart-line__top">
                        <p className="cart-line__name">{productTitle}</p>
                        <p className="cart-line__total">
                          {convertToLocale({ amount: unitPrice * quantity, currencyCode })}
                        </p>
                      </div>
                      <p className="cart-line__meta">
                        {variantTitle && variantTitle !== "Standard" && `${variantTitle} · `}
                        {convertToLocale({ amount: unitPrice, currencyCode })} pro Stück
                      </p>
                      <div className="cart-line__actions">
                        <QtyStepper
                          value={quantity}
                          label={`Anzahl ${productTitle}`}
                          disabled={busy}
                          decreaseLabel={
                            quantity <= 1 ? `${productTitle} entfernen` : "Menge verringern"
                          }
                          onDecrease={() =>
                            run(item.id, () => updateLineItemQuantity(item.id, quantity - 1))
                          }
                          onIncrease={() =>
                            run(item.id, () => updateLineItemQuantity(item.id, quantity + 1))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => run(item.id, () => removeFromCart(item.id))}
                          disabled={busy}
                          className="text-btn"
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
          </div>

          <aside className="summary-card" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title" className="summary-card__title">
              Zusammenfassung
            </h2>
            <CartTotals
              currencyCode={currencyCode}
              itemTotal={cart?.item_total}
              shippingTotal={cart?.shipping_total}
              shippingPending={!cart?.shipping_methods?.length}
              taxTotal={cart?.tax_total}
              discountTotal={cart?.discount_total}
              total={cart?.total}
            />
            <a
              href={`/${countryCode}/checkout`}
              className="btn btn--primary btn--block btn--lg"
            >
              Zur Kasse
            </a>
            <p className="summary-card__hint">
              Lieferung nur innerhalb Deutschlands. Bezahlung per Karte und
              weiteren Zahlarten über SumUp.
            </p>
            <a href={`/${countryCode}/store`} className="cart-drawer__more">
              Weiter stöbern
            </a>
          </aside>
        </div>
      )}
    </div>
  );
};
