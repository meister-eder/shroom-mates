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
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-400">Lieferung</h2>
      </div>
    );
  }

  if (mode === "read") {
    const method = cart.shipping_methods?.[0];
    const currencyCode = cart.currency_code || "EUR";

    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Lieferung
            <CheckCircle />
          </h2>
          <button
            type="button"
            onClick={onEdit}
            className="text-sm hover:underline"
            style={{ color: "var(--accent, #ff4908)" }}
          >
            Bearbeiten
          </button>
        </div>

        {method && (
          <div className="text-sm">
            <p className="font-medium mb-1">Versandart</p>
            <p className="text-gray-700">
              {method.name}
              {" \u2014 "}
              {method.amount === 0
                ? "Kostenlos"
                : convertToLocale({ amount: method.amount, currencyCode })}
            </p>
          </div>
        )}
      </div>
    );
  }

  const currencyCode = cart.currency_code || "EUR";

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">Lieferung</h2>

      <div>
        <p className="font-medium mb-1">Versandart</p>
        <p className="text-sm text-gray-500 mb-4">
          Wähle deine gewünschte Versandart
        </p>

        {isLoading && (
          <p className="text-sm text-gray-500 mb-4">
            Versandoptionen werden geladen...
          </p>
        )}

        {!isLoading && shippingOptions.length === 0 && !error && (
          <p className="text-sm text-gray-500 mb-4">
            Keine Versandoptionen für deine Adresse verfügbar.
          </p>
        )}

        {!isLoading && shippingOptions.length > 0 && (
          <div className="space-y-3 mb-6">
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center justify-between border rounded-md px-4 py-3 cursor-pointer transition-colors ${
                  selectedOptionId === option.id
                    ? "border-black"
                    : "border-gray-200 hover:border-gray-400"
                }`}
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
                <span className="text-sm text-gray-700">
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

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

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
