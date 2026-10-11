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
      className={`cart-button${cartItemCount > 0 ? " has-items" : ""}`}
      aria-label={`Warenkorb mit ${cartItemCount} ${cartItemCount === 1 ? "Artikel" : "Artikeln"}`}
    >
      <span aria-live="polite" aria-atomic="true">
        🛒 Warenkorb ({cartItemCount})
      </span>
    </button>
  );
};
