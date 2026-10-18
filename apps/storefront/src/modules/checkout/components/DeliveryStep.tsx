import { addShippingMethod } from "@lib/stores/cart";
import { sdk } from "@lib/sdk";
import { convertToLocale } from "@lib/utils/money";
import type { StoreCart, StoreCartShippingOptionWithServiceZone } from "@medusajs/types";
import { useEffect, useState } from "react";
import { CheckoutStep } from "./CheckoutStep";
import { ERROR_CLASS } from "./AddressFields";
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
  const [shippingOptions, setShippingOptions] = useState<StoreCartShippingOptionWithServiceZone[]>(
    [],
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currencyCode = cart.currency_code || "EUR";
  const formatPrice = (amount: number) =>
    amount === 0 ? "Kostenlos" : convertToLocale({ amount, currencyCode });

  useEffect(() => {
    if (mode !== "edit") return;

    const fetchOptions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { shipping_options } =
          await sdk.store.fulfillment.listCartOptions({ cart_id: cart.id });
        setShippingOptions(shipping_options);

        // Pre-select if cart already has a shipping method
        const existingMethodId = cart.shipping_methods?.[0]?.shipping_option_id;
        if (existingMethodId) {
          setSelectedOptionId(existingMethodId);
        }
      } catch (err) {
        console.error("Failed to load shipping options:", err);
        setError("Versandoptionen konnten nicht geladen werden. Bitte versuche es erneut.");
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
      setError("Versandart konnte nicht aktualisiert werden. Bitte versuche es erneut.");
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
          <div>
            <p className="label mb-1">Versandart</p>
            <p>
              {method.name} — {formatPrice(method.amount)}
            </p>
          </div>
        )}
      </CheckoutStep>
    );
  }

  return (
    <CheckoutStep number={2} title="Lieferung" state="active">
      {isLoading && (
        <p className="mb-4 text-muted">Versandoptionen werden geladen...</p>
      )}

      {!isLoading && shippingOptions.length === 0 && !error && (
        <p className="mb-4 text-muted">
          Keine Versandoptionen für deine Adresse verfügbar.
        </p>
      )}

      {!isLoading && shippingOptions.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {shippingOptions.map((option) => (
            <OptionCard
              key={option.id}
              name="shipping_option"
              value={option.id}
              checked={selectedOptionId === option.id}
              onSelect={handleOptionChange}
              aside={<span className="font-mono text-lg">{formatPrice(option.amount)}</span>}
            >
              {option.name}
            </OptionCard>
          ))}
        </div>
      )}

      {error && <p className={`${ERROR_CLASS} mb-4`} role="alert">{error}</p>}

      <button
        type="button"
        disabled={!selectedOptionId || isSaving}
        onClick={onContinue}
        className="btn btn--primary btn--block min-h-[58px] text-lg"
      >
        {isSaving ? "Wird gespeichert..." : "Weiter zur Zahlung"}
      </button>
    </CheckoutStep>
  );
};
