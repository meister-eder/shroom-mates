import {
  $cartItemCount,
  $regionId,
  initCart,
  toggleCartSidebar,
} from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { useHydrated } from "@lib/hooks/use-hydrated";
import { Icon } from "@modules/common/components/Icon";
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
      <Icon name="cart" size={20} />
      <span className="cart-pill__label" aria-hidden="true">
        Pilzkorb
      </span>
      <span className="cart-pill__count" aria-hidden="true">
        {cartItemCount}
      </span>
    </button>
  );
};
