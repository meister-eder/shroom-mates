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

export const CartButton = ({ regionId }: CartButtonProps) => {
  const cartItemCount = useStore($cartItemCount);

  useEffect(() => {
    if (regionId) {
      $regionId.set(regionId);
      initCart();
    }
  }, [regionId]);

  return (
    <button
      onClick={() => toggleCartSidebar()}
      className="cart-button"
      style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: "0.9rem",
        background: "none",
        border:
          cartItemCount > 0
            ? "2px solid var(--accent, #ff4908)"
            : "2px solid #000",
        borderRadius: "6px",
        padding: "0.4rem 1rem",
        cursor: "pointer",
        color: "var(--text-color, #1d1d1d)",
        transition: "all 0.2s ease",
      }}
      aria-label={`Warenkorb mit ${cartItemCount} ${cartItemCount === 1 ? "Artikel" : "Artikeln"}`}
    >
      <span aria-live="polite" aria-atomic="true">
        🛒 Warenkorb ({cartItemCount})
      </span>
    </button>
  );
};
