import { useHydrated } from "@lib/hooks/use-hydrated";
import {
  $cartItemCount,
  $regionId,
  initCart,
  toggleCartSidebar,
} from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";

interface CartButtonProps {
  regionId?: string | null;
}

/** Pilzkorb pill in the header (accent button, stroke icon, count badge). */
export const CartButton = ({ regionId }: CartButtonProps) => {
  const storedCount = useStore($cartItemCount);
  const hydrated = useHydrated();
  // Server markup shows 0 items; switch to the real count after hydration.
  const cartItemCount = hydrated ? storedCount : 0;

  useEffect(() => {
    if (regionId) {
      $regionId.set(regionId);
      initCart();
    }
  }, [regionId]);

  return (
    <button
      type="button"
      onClick={() => toggleCartSidebar()}
      className={`cart-pill${cartItemCount > 0 ? " has-items" : ""}`}
      aria-label={`Pilzkorb, ${cartItemCount} Artikel`}
      aria-haspopup="dialog"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 10a5 5 0 0 1 10 0" />
        <path d="M3 10h18l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.2H6.3a1.5 1.5 0 0 1-1.5-1.2Z" />
        <path d="M9 13.5v4M12 13.5v4M15 13.5v4" />
      </svg>
      <span className="cart-pill__label" aria-hidden="true">
        Pilzkorb
      </span>
      <span className="cart-pill__count" aria-hidden="true">
        {cartItemCount}
      </span>
    </button>
  );
};
