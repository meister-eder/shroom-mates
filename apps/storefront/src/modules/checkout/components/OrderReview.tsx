import { formatAddressLines } from "@lib/utils/address";
import type { StoreCart } from "@medusajs/types";
import { CartTotals } from "@modules/common/components/CartTotals";
import { LineItemRow } from "@modules/common/components/LineItemRow";

interface OrderReviewProps {
  cart: StoreCart;
  countryCode: string;
}

/**
 * Overview directly above the order button (§ 312j Abs. 2 BGB): products,
 * shipping, total incl. VAT and the delivery address, each changeable.
 */
export const OrderReview = ({ cart, countryCode }: OrderReviewProps) => {
  const currencyCode = cart.currency_code || "EUR";
  const shipping = cart.shipping_methods?.[0];

  return (
    <section className="order-review" aria-label="Bestellübersicht">
      <h3 className="input-label mb-2">Deine Bestellung</h3>
      <div className="mb-3">
        {cart.items?.map((item) => (
          <LineItemRow
            key={item.id}
            title={item.variant?.product?.title || item.product_title || "Produkt"}
            subtitle={item.variant?.title}
            thumbnail={item.variant?.product?.thumbnail || item.thumbnail}
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
        shippingLabel={shipping?.name ? `Versand (${shipping.name})` : "Versand"}
        taxTotal={cart.tax_total}
        discountTotal={cart.discount_total}
        total={cart.total}
      />
      <div className="text-sm mt-4 flex flex-wrap justify-between gap-2">
        <span className="text-muted">
          Lieferung an: {formatAddressLines(cart.shipping_address).join(", ")}
        </span>
        <a href={`/${countryCode}/checkout?step=address`} className="checkout-edit-btn">
          Ändern
        </a>
      </div>
    </section>
  );
};
