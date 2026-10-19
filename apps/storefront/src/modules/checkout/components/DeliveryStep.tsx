import { storeApi } from "@lib/store-api";
import { addShippingMethod } from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import type {
  StoreCart,
  StoreCartShippingOptionWithServiceZone,
} from "@medusajs/types";
import { useEffect, useState } from "react";
import { ERROR_CLASS } from "./AddressFields";
import { CheckoutStep } from "./CheckoutStep";
import { OptionCard } from "./OptionCard";

interface DeliveryStepProps {
  cart: StoreCart;
  mode: "edit" | "read" | "inactive";
  onContinue: () => void;
  onEdit?: () => void;
}

export const DeliveryStep = ({
  cart,
  mode,
  onContinue,
  onEdit,
}: DeliveryStepProps) => {
  const [shippingOptions, setShippingOptions] = useState<
    StoreCartShippingOptionWithServiceZone[]
  >([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currencyCode = cart.currency_code || "EUR";
  const formatPrice = (amount: number) =>
    amount === 0 ? "Kostenlos" : convertToLocale({ amount, currencyCode });

  // biome-ignore lint/correctness/useExhaustiveDependencies: läuft bewusst nur bei den genannten Abhängigkeiten
  useEffect(() => {
    if (mode !== "edit") return;

    const fetchOptions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { shipping_options } = await storeApi.fulfillment.listCartOptions(
          { cart_id: cart.id },
        );
        setShippingOptions(shipping_options);

        // Pre-select if cart already has a shipping method
        const existingMethodId = cart.shipping_methods?.[0]?.shipping_option_id;
        if (existingMethodId) {
          setSelectedOptionId(existingMethodId);
        }
      } catch (err) {
        console.error("Failed to load shipping options:", err);
        setError(
          "Versandoptionen konnten nicht geladen werden. Bitte versuche es erneut.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [mode, cart.id]);

  const handleOptionChange = async (optionId: string) => {
    if (isSaving) return;
    setSelectedOptionId(optionId);
    setIsSaving(true);
    setError("");
    try {
      await addShippingMethod(optionId);
    } catch (err) {
      console.error("Failed to update shipping method:", err);
      setError(
        "Versandart konnte nicht aktualisiert werden. Bitte versuche es erneut.",
      );
      // Revert to the previously saved method
      const savedMethodId = cart.shipping_methods?.[0]?.shipping_option_id;
      setSelectedOptionId(savedMethodId ?? "");
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "inactive") {
    return <CheckoutStep number={2} title="Lieferung" state="inactive" />;
  }

  if (mode === "read") {
    const method = cart.shipping_methods?.[0];
    return (
      <CheckoutStep number={2} title="Lieferung" state="done" onEdit={onEdit}>
        {method && (
          <p className="checkout-line">
            {method.name} · {formatPrice(method.amount)}
          </p>
        )}
      </CheckoutStep>
    );
  }

  return (
    <CheckoutStep number={2} title="Lieferung" state="active">
      {isLoading && (
        <p className="checkout-note checkout-note--tight">
          Versandoptionen werden geladen...
        </p>
      )}

      {!isLoading && shippingOptions.length === 0 && !error && (
        <p className="checkout-note">
          Keine Versandoptionen für deine Adresse verfügbar.
        </p>
      )}

      {!isLoading && shippingOptions.length > 0 && (
        <div className="checkout-options checkout-options--tight">
          {shippingOptions.map((option) => (
            <OptionCard
              key={option.id}
              name="shipping_option"
              value={option.id}
              checked={selectedOptionId === option.id}
              onSelect={handleOptionChange}
              aside={
                <span className="optcard-price">
                  {formatPrice(option.amount)}
                </span>
              }
            >
              {option.name}
            </OptionCard>
          ))}
        </div>
      )}

      {error && (
        <p className={`${ERROR_CLASS} checkout-error--spaced`} role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!selectedOptionId || isSaving}
        onClick={onContinue}
        className="btn btn--primary btn--block"
      >
        {isSaving ? "Wird gespeichert..." : "Weiter zur Zahlung"}
      </button>
    </CheckoutStep>
  );
};
