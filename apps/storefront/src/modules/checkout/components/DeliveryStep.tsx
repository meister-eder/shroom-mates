import { addShippingMethod } from "@lib/stores/cart";
import { sdk } from "@lib/sdk";
import { convertToLocale } from "@lib/utils/money";
import type { StoreCart, StoreCartShippingOptionWithServiceZone } from "@medusajs/types";
import { useEffect, useState } from "react";

interface DeliveryStepProps {
  cart: StoreCart;
  mode: "edit" | "read" | "inactive";
  onContinue: () => void;
  onEdit?: () => void;
}

const CheckCircle = () => (
  <span className="inline-flex items-center justify-center w-5 h-5 bg-black rounded-full shrink-0">
    <svg
      className="w-3 h-3 text-white"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

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
    return (
      <div className="checkout-step" style={{ opacity: 0.5 }}>
        <div className="checkout-step-header">
          <div className="checkout-step-number">2</div>
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem", color: "var(--text-muted)" }}>
            Lieferung
          </h2>
        </div>
      </div>
    );
  }

  if (mode === "read") {
    const method = cart.shipping_methods?.[0];
    const currencyCode = cart.currency_code || "EUR";

    return (
      <div className="checkout-step">
        <div className="checkout-step-header">
          <div className="checkout-step-number done">2</div>
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem" }}>
            Lieferung
          </h2>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: "#000", marginLeft: "0.25rem" }}>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ color: "#fff" }}>
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto text-sm hover:underline"
            style={{ color: "var(--accent, #ff4908)" }}
          >
            Bearbeiten
          </button>
        </div>

        <div className="checkout-step-body">
          {method && (
            <div className="text-sm">
              <p className="input-label mb-1">Versandart</p>
              <p style={{ color: "var(--text-muted)" }}>
                {method.name}
                {" — "}
                {method.amount === 0
                  ? "Kostenlos"
                  : convertToLocale({ amount: method.amount, currencyCode })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currencyCode = cart.currency_code || "EUR";

  return (
    <div className="checkout-step">
      <div className="checkout-step-header">
        <div className="checkout-step-number active">2</div>
        <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem" }}>
          Lieferung
        </h2>
      </div>

      <div className="checkout-step-body">
        {isLoading && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Versandoptionen werden geladen...
          </p>
        )}

        {!isLoading && shippingOptions.length === 0 && !error && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Keine Versandoptionen für deine Adresse verfügbar.
          </p>
        )}

        {!isLoading && shippingOptions.length > 0 && (
          <div className="space-y-3 mb-6">
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                style={{
                  border: `2px solid ${selectedOptionId === option.id ? "var(--accent, #ff4908)" : "#000"}`,
                  borderRadius: 8,
                  background: selectedOptionId === option.id ? "var(--bg-accent, #fdfcea)" : "#fff",
                }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping_option"
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    onChange={() => handleOptionChange(option.id)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-sm font-medium">{option.name}</span>
                </div>
                <span className="text-sm" style={{ fontFamily: '"DM Mono", monospace' }}>
                  {option.amount === 0
                    ? "Kostenlos"
                    : convertToLocale({
                      amount: option.amount,
                      currencyCode,
                    })}
                </span>
              </label>
            ))}
          </div>
        )}

        {error && <p className="input-error mb-4">{error}</p>}

        <button
          type="button"
          disabled={!selectedOptionId || isSaving}
          onClick={onContinue}
          className="text-white py-3 px-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--accent, #ff4908)",
            border: "2px solid #000",
            fontFamily: '"DM Mono", monospace',
          }}
        >
          {isSaving ? "Wird gespeichert..." : "Weiter zur Zahlung"}
        </button>
      </div>
    </div>
  );
};
