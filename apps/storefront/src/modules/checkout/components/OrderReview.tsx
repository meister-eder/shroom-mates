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
    <section className="rounded-[18px] border-2 border-ink bg-paper p-4 sm:p-5" aria-label="Bestellübersicht">
      <h3 className="mb-3 font-display text-[22px]! leading-none! font-black">Deine Bestellung</h3>
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
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink pt-3">
        <span>
          Lieferung an: {formatAddressLines(cart.shipping_address).join(", ")}
        </span>
        <a href={`/${countryCode}/checkout?step=address`} className="inline-flex min-h-11 items-center font-semibold text-accent-dark underline hover:text-ink">
          Ändern
        </a>
      </div>
    </section>
  );
};
