import {
  $cart,
  $isCartLoading,
  removeFromCart,
  updateLineItemQuantity,
} from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import { useStore } from "@nanostores/react";
import { CartTotals } from "@modules/common/components/CartTotals";

interface CartPageProps {
  countryCode: string;
}

export const CartPage = ({ countryCode }: CartPageProps) => {
  const cart = useStore($cart);
  const isCartLoading = useStore($isCartLoading);

  const handleRemoveItem = async (lineItemId: string) => {
    try {
      await removeFromCart(lineItemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const handleQuantityChange = async (
    lineItemId: string,
    newQuantity: number,
  ) => {
    try {
      await updateLineItemQuantity(lineItemId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const itemCount = cart?.items?.length ?? 0;
  const isEmpty = itemCount === 0;

  if (!cart && isCartLoading) {
    return <p className="text-muted text-center py-16">Warenkorb wird geladen…</p>;
  }
  const currencyCode = cart?.currency_code || "EUR";

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      {isEmpty ? (
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Dein Warenkorb ist leer</h1>
          <p className="text-gray-600 mb-6">Füge Artikel zu deinem Warenkorb hinzu</p>
          <a
            href={`/${countryCode}/store`}
            className="btn-accent inline-block"
          >
            Weiter einkaufen
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Cart items */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-6">Warenkorb</h1>

            {/* Cart items table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="col-span-5">Artikel</div>
                <div className="col-span-2 text-center">Anzahl</div>
                <div className="col-span-2 text-right">Preis</div>
                <div className="col-span-2 text-right">Gesamt</div>
                <div className="col-span-1"></div>
              </div>

              {cart?.items?.map((item) => {
                const thumbnailUrl =
                  item.variant?.product?.thumbnail ||
                  item.variant?.product?.images?.[0]?.url;
                const productTitle = item.variant?.product?.title || "Product";
                const variantTitle = item.variant?.title || "";
                const unitPrice = item.unit_price || 0;
                const quantity = item.quantity || 1;
                const lineTotal = unitPrice * quantity;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 last:border-0 items-center"
                  >
                    {/* Item */}
                    <div className="col-span-12 md:col-span-5 flex gap-4">
                      {thumbnailUrl && (
                        <img
                          src={thumbnailUrl}
                          alt={productTitle}
                          className="w-20 h-20 object-cover rounded"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{productTitle}</h3>
                        {variantTitle && (
                          <p className="text-sm text-gray-500">
                            Variante: {variantTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, quantity - 1)
                          }
                          className="w-11 h-11 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 text-lg"
                          aria-label={
                            quantity <= 1 ? `${productTitle} entfernen` : "Menge verringern"
                          }
                        >
                          −
                        </button>
                        <span
                          className="w-10 text-center font-medium tabular-nums"
                          aria-live="polite"
                          aria-label={`Menge: ${quantity}`}
                        >
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, quantity + 1)
                          }
                          className="w-11 h-11 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 text-lg"
                          aria-label="Menge erhöhen"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-3 md:col-span-2 text-right text-sm">
                      {convertToLocale({
                        amount: unitPrice,
                        currencyCode,
                      })}
                    </div>

                    {/* Total */}
                    <div className="col-span-3 md:col-span-2 text-right font-medium">
                      {convertToLocale({
                        amount: lineTotal,
                        currencyCode,
                      })}
                    </div>

                    {/* Remove */}
                    <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-11 h-11 flex items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label={`${productTitle} aus dem Warenkorb entfernen`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 order-summary-card">
              <div className="order-summary-header">
                <h2 className="checkout-step-title">Zusammenfassung</h2>
              </div>
              <div className="order-summary-body">
                <CartTotals
                  currencyCode={currencyCode}
                  itemTotal={cart?.item_total}
                  shippingTotal={cart?.shipping_total}
                  shippingPending={!cart?.shipping_methods?.length}
                  taxTotal={cart?.tax_total}
                  discountTotal={cart?.discount_total}
                  total={cart?.total}
                />
                <a href={`/${countryCode}/checkout`} className="btn-accent w-full mt-6">
                  Zur Kasse
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
