import { flyToCart } from "@lib/fly-to-cart";
import { addToCart } from "@lib/stores/cart";
import { showAddedToast, showErrorToast } from "@lib/stores/toast";
import { Icon } from "@modules/common/components/Icon";
import { useState } from "react";

interface QuickAddProps {
  variantId: string;
  title: string;
}

/**
 * "Rein ins Körbchen" on the product card (round 44px "+" on mobile). Only
 * rendered for products with exactly one variant; the cart drawer stays
 * closed, the toast confirms.
 */
export const QuickAdd = ({ variantId, title }: QuickAddProps) => {
  const [busy, setBusy] = useState(false);

  const add = async (ev: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) return;
    const button = ev.currentTarget;
    setBusy(true);
    try {
      await addToCart(variantId, 1, { openSidebar: false });
      flyToCart(button);
      showAddedToast(title);
    } catch {
      showErrorToast("Lade die Seite neu und versuch es nochmal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="quick-add"
      onClick={add}
      disabled={busy}
      aria-label={`${title} rein ins Körbchen`}
    >
      <Icon name="plus" size={16} strokeWidth={3} />
      <span className="quick-add__label">Rein ins Körbchen</span>
    </button>
  );
};
