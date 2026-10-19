import {
  $cart,
  $isCartLoading,
  removeFromCart,
  updateLineItemQuantity,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import { useStore } from "@nanostores/react";
import { MatesEyes } from "@modules/common/components/MatesEyes";
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

  const discountTotal = cart?.discount_total ?? 0;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-8 sm:px-8">
      {isEmpty ? (
        <div className="flex flex-col items-center px-0 py-8 text-center">
          <MatesEyes size={180} alt="" className="mb-5 max-w-full" />
          <h1 className="mb-1.5! text-[clamp(36px,5vw,56px)]! leading-[.95]! text-accent">
            Hier wächst noch nichts.
          </h1>
          <p className="mb-5 mt-3 text-base">Die Mates langweilen sich.</p>
          <a href={`/${countryCode}/store`} className="btn btn--primary min-h-[50px] px-[22px]">
            Zum Sortiment
          </a>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <MatesEyes size={64} alt="" className="hidden shrink-0 sm:block" />
            <h1 className="text-[clamp(44px,5vw,72px)]! leading-[.92]! text-accent">
              Dein Pilzkorb
            </h1>
          </div>

          <div className="flex flex-wrap items-start gap-8 lg:gap-10">
            <ul className="m-0 flex min-w-0 flex-[999_1_560px] list-none flex-col gap-3.5 p-0" role="list">
              {cart?.items?.map((item) => {
                const product = item.variant?.product;
                const thumbnailUrl =
                  item.thumbnail || product?.thumbnail || product?.images?.[0]?.url;
                const productTitle = product?.title || item.title || "Produkt";
                const variantTitle = item.variant?.title || "";
                const unitPrice = item.unit_price || 0;
                const quantity = item.quantity || 1;
                const busy = busyId === item.id;
                const thumbClass =
                  "box-border h-[84px] w-[84px] shrink-0 rounded-none border-2 border-accent object-cover sm:h-[104px] sm:w-[104px]";

                return (
                  <li
                    key={item.id}
                    aria-busy={busy}
                    className={`flex gap-3.5 rounded-none border-2 border-accent bg-white p-3 sm:gap-[18px] sm:p-4 ${
                      busy ? "opacity-60" : ""
                    }`}
                  >
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={productTitle} className={thumbClass} loading="lazy" />
                    ) : (
                      <div className={`${thumbClass} bg-paper`} aria-hidden="true" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex justify-between gap-2">
                        <p className="m-0 font-display text-[19px] font-extrabold leading-[1.15] sm:text-[22px]">
                          {productTitle}
                        </p>
                        <p className="m-0 whitespace-nowrap font-mono text-[15px] sm:text-lg">
                          {convertToLocale({ amount: unitPrice * quantity, currencyCode })}
                        </p>
                      </div>
                      <p className="m-0 font-mono text-xs text-muted">
                        {variantTitle && `${variantTitle} · `}
                        {convertToLocale({ amount: unitPrice, currencyCode })}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between">
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
                          className="min-h-11 cursor-pointer border-0 bg-transparent px-2.5 font-body text-sm text-accent-dark underline hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
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
              className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5 rounded-none border-2 border-accent bg-paper p-[22px] lg:sticky lg:top-6"
            >
              <h2 id="cart-summary-title" className="sr-only">
                Zusammenfassung
              </h2>
              <div className="flex items-baseline justify-between gap-4 text-[17px]">
                <span>Zwischensumme</span>
                <span className="font-mono text-xl">
                  {convertToLocale({ amount: cart?.item_total ?? 0, currencyCode })}
                </span>
              </div>
              {discountTotal > 0 && (
                <div className="flex items-baseline justify-between gap-4 font-bold">
                  <span>Rabatt</span>
                  <span className="font-mono">
                    −{convertToLocale({ amount: discountTotal, currencyCode })}
                  </span>
                </div>
              )}
              <p className="m-0 font-mono text-xs text-muted">
                inkl. MwSt. · Versand wird im nächsten Schritt berechnet
              </p>
              <a
                href={`/${countryCode}/checkout`}
                className="btn btn--primary btn--block mt-1.5 min-h-[58px] text-[19px]"
              >
                Zur Kasse
              </a>
              <a
                href={`/${countryCode}/store`}
                className="flex min-h-11 items-center justify-center p-2 font-semibold text-ink hover:text-accent-dark"
              >
                Weiter stöbern
              </a>
              <p className="m-0 font-mono text-xs text-muted">
                Lieferung nur innerhalb Deutschlands. Bezahlung per Karte und weiteren
                Zahlarten über SumUp.
              </p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
