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

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await addToCart(variantId, 1, { openSidebar: false });
      showAddedToast(title);
    } catch {
      showErrorToast(`${title}: Bitte versuch es auf der Produktseite.`);
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
      <Icon name="plus" size={18} strokeWidth={2.8} />
      <span className="quick-add__label">Rein ins Körbchen</span>
    </button>
  );
};
