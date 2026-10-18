import type { StoreCart } from "@medusajs/types";
import { CartTotals } from "@modules/common/components/CartTotals";
import { LineItemRow } from "@modules/common/components/LineItemRow";

interface OrderSummaryProps {
  cart: StoreCart;
}

export const OrderSummary = ({ cart }: OrderSummaryProps) => {
  const currencyCode = cart.currency_code || "EUR";

  return (
    <aside
      aria-labelledby="order-summary-title"
      className="rounded-[26px] border-[3px] border-ink bg-paper p-[22px] shadow-card lg:sticky lg:top-6"
    >
      <h2
        id="order-summary-title"
        className="m-0 mb-3 font-display text-[26px]! leading-none! font-black"
      >
        Dein Pilzkorb
      </h2>

      <div className="mb-4 border-b-2 border-ink pb-2">
        {cart.items?.map((item) => (
          <LineItemRow
            key={item.id}
            title={item.variant?.product?.title || item.product_title || "Produkt"}
            subtitle={item.variant?.title}
            thumbnail={
              item.variant?.product?.thumbnail || item.variant?.product?.images?.[0]?.url
            }
            quantity={item.quantity || 1}
            unitPrice={item.unit_price || 0}
            currencyCode={currencyCode}
          />
        ))}
      </div>

      <CartTotals
        currencyCode={currencyCode}
        itemTotal={cart.item_total}
        shippingTotal={cart.shipping_total}
        shippingPending={!cart.shipping_methods?.length}
        taxTotal={cart.tax_total}
        discountTotal={cart.discount_total}
        total={cart.total}
      />
    </aside>
  );
};
