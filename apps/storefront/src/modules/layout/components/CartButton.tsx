import {
  $cartItemCount,
  $regionId,
  initCart,
  toggleCartSidebar,
} from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { useHydrated } from "@lib/hooks/use-hydrated";
import { useEffect } from "react";

interface CartButtonProps {
  regionId?: string | null;
}

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
      onClick={() => toggleCartSidebar()}
      className={`cart-button${cartItemCount > 0 ? " has-items" : ""}`}
      aria-label={`Warenkorb mit ${cartItemCount} ${cartItemCount === 1 ? "Artikel" : "Artikeln"}`}
    >
      <span aria-live="polite" aria-atomic="true">
        🛒<span className="cart-label"> Warenkorb</span> ({cartItemCount})
      </span>
    </button>
  );
};
