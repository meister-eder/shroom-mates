import { useHydrated } from "@lib/hooks/use-hydrated";
import {
  $cart,
  $isCartSidebarOpen,
  closeCartSidebar,
  removeFromCart,
  updateLineItemQuantity,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import { stickerColor, stickerColorVar } from "@lib/utils/product-color";
import { Icon } from "@modules/common/components/Icon";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { QtyStepper } from "@modules/common/components/QtyStepper";
import { useStore } from "@nanostores/react";
import { SHIPPING } from "@shroom-mates/ui/shop-facts";
import { useEffect, useRef, useState } from "react";

interface CartSidebarProps {
  countryCode: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const CartSidebar = ({ countryCode }: CartSidebarProps) => {
  const storedCart = useStore($cart);
  const isOpen = useStore($isCartSidebarOpen);
  // Server markup has no cart; render the real one only after hydration.
  const hydrated = useHydrated();
  const cart = hydrated ? storedCart : null;
  const sidebarRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Escape closes, Tab stays inside the dialog, page scroll is locked.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCartSidebar();
        return;
      }
      if (e.key !== "Tab" || !sidebarRef.current) return;
      const focusable = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (
        e.shiftKey &&
        (active === first || !sidebarRef.current.contains(active))
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (active === last || !sidebarRef.current.contains(active))
      ) {
        e.preventDefault();
        first.focus();
      }
    };

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKeys);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeys);
      document.body.style.overflow = "";
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      sidebarRef.current.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      closeCartSidebar();
    }
  };

  const run = async (
    lineItemId: string,
    action: () => Promise<void>,
    what: string,
  ) => {
    setBusyId(lineItemId);
    try {
      await action();
    } catch (error) {
      console.error(`Failed to ${what}:`, error);
    } finally {
      setBusyId(null);
    }
  };

  const itemCount = cart?.items?.length ?? 0;
  const isEmpty = itemCount === 0;
  const currencyCode = cart?.currency_code || "EUR";

  return (
    <>
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className="cart-backdrop"
        data-open={isOpen}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pilzkorb"
        className="cart-drawer"
        data-open={isOpen}
        inert={!isOpen}
      >
        <div className="cart-drawer__head">
          <MatesEyes size={54} className="cart-drawer__mascot" />
          <h2 className="cart-drawer__title">Dein Pilzkorb</h2>
          <button
            type="button"
            onClick={closeCartSidebar}
            className="round-btn"
            aria-label="Pilzkorb schließen"
          >
            <Icon name="close" size={14} strokeWidth={2.6} />
          </button>
        </div>

        {isEmpty ? (
          <div className="cart-empty">
            <MatesEyes size={180} className="cart-empty__mascot" />
            <p className="cart-empty__title">Hier wächst noch nichts.</p>
            <p className="cart-empty__text">Die Mates langweilen sich.</p>
            <a
              href={`/${countryCode}/store`}
              onClick={closeCartSidebar}
              className="btn btn--primary"
            >
              Zum Sortiment
            </a>
          </div>
        ) : (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: ARIA-Rolle bewusst gesetzt, natives Element würde Darstellung und Verhalten ändern */}
            {/* biome-ignore lint/a11y/noRedundantRoles: role="list" bleibt, weil list-style: none in Safari/VoiceOver die Listensemantik entfernt */}
            <ul className="cart-drawer__items" role="list">
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
                const color = stickerColorVar(
                  stickerColor({
                    handle: product?.handle,
                    title: productTitle,
                  }),
                );
                const busy = busyId === item.id;

                return (
                  <li key={item.id} className="cart-line" aria-busy={busy}>
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt=""
                        width={84}
                        height={84}
                        className="cart-line__thumb"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : (
                      <div
                        className="cart-line__thumb"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                    )}
                    <div className="cart-line__body">
                      <div className="cart-line__top">
                        <p className="cart-line__name">{productTitle}</p>
                        <p className="cart-line__total">
                          {convertToLocale({
                            amount: unitPrice * quantity,
                            currencyCode,
                          })}
                        </p>
                      </div>
                      <p className="cart-line__meta">
                        {variantTitle &&
                          variantTitle !== "Standard" &&
                          `${variantTitle} · `}
                        {convertToLocale({ amount: unitPrice, currencyCode })}
                      </p>
                      <div className="cart-line__actions">
                        <QtyStepper
                          value={quantity}
                          label={`Anzahl ${productTitle}`}
                          disabled={busy}
                          onDecrease={() =>
                            run(
                              item.id,
                              () =>
                                updateLineItemQuantity(item.id, quantity - 1),
                              "update quantity",
                            )
                          }
                          onIncrease={() =>
                            run(
                              item.id,
                              () =>
                                updateLineItemQuantity(item.id, quantity + 1),
                              "update quantity",
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              item.id,
                              () => removeFromCart(item.id),
                              "remove item",
                            )
                          }
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
            <div className="cart-drawer__foot">
              <div className="cart-drawer__subtotal">
                <span>Zwischensumme</span>
                <span>
                  {convertToLocale({
                    amount: cart?.item_total || 0,
                    currencyCode,
                  })}
                </span>
              </div>
              <p className="cart-drawer__note">
                inkl. MwSt. · Versand ab {SHIPPING.standard.price} im nächsten
                Schritt
              </p>
              <a
                href={`/${countryCode}/checkout`}
                onClick={closeCartSidebar}
                className="btn btn--primary btn--block btn--lg"
              >
                Zur Kasse
              </a>
              <a
                href={`/${countryCode}/store`}
                onClick={closeCartSidebar}
                className="cart-drawer__more"
              >
                Weiter stöbern
              </a>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
