import {
  formatProviderName,
  isSumUpProvider,
  isTestProvider,
} from "@lib/checkout/payment-providers";
import { goToOrderConfirmation } from "@lib/checkout/order-handoff";
import { sdk } from "@lib/sdk";
import { initPaymentSession, placeOrder } from "@lib/stores/cart";
import type { StoreCart, StorePaymentProvider } from "@medusajs/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckoutStep } from "./CheckoutStep";
import { OptionCard } from "./OptionCard";
import { SumUpWidget, type SumUpResponseType } from "./SumUpWidget";

interface PaymentStepProps {
  cart: StoreCart;
  countryCode: string;
  mode: "edit" | "inactive";
}

const ORDER_FAILED = "Bestellung konnte nicht aufgegeben werden. Bitte versuche es erneut.";

export const PaymentStep = ({ cart, countryCode, mode }: PaymentStepProps) => {
  const [paymentProviders, setPaymentProviders] = useState<StorePaymentProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [error, setError] = useState("");

  const sessions = cart.payment_collection?.payment_sessions ?? [];
  const session = sessions.find((s) => s.provider_id === selectedProviderId);
  const isSumUp = isSumUpProvider(selectedProviderId);
  const sumupCheckoutId =
    isSumUp && !isSaving ? (session?.data?.id as string | undefined) : undefined;

  useEffect(() => {
    if (mode !== "edit") return;

    const fetchProviders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { payment_providers } = await sdk.store.payment.listPaymentProviders({
          region_id: cart.region_id!,
        });
        setPaymentProviders(payment_providers);

        const existingProviderId = sessions[0]?.provider_id;
        if (existingProviderId) {
          setSelectedProviderId((current) => current || existingProviderId);
        }
      } catch (err) {
        console.error("Failed to load payment providers:", err);
        setError("Zahlungsoptionen konnten nicht geladen werden. Bitte versuche es erneut.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [mode, cart.region_id]);

  const startSession = useCallback(
    async (providerId: string) => {
      setIsSaving(true);
      setPaymentFailed(false);
      setError("");
      try {
        await initPaymentSession(providerId, {
          redirectUrl: `${window.location.origin}/${countryCode}/checkout/complete`,
        });
        return true;
      } catch (err) {
        console.error("Failed to initialize payment session:", err);
        setError("Zahlungsmethode konnte nicht gesetzt werden. Bitte versuche es erneut.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [countryCode],
  );

  const handleProviderChange = async (providerId: string) => {
    if (isSaving) return;
    const previous = selectedProviderId;
    setSelectedProviderId(providerId);
    if (!(await startSession(providerId))) setSelectedProviderId(previous);
  };

  // Medusa deletes payment sessions whenever the cart total changes (shipping
  // method, quantities). Re-create the session for the selected provider so
  // the step doesn't get stuck without a checkout. Once per provider + total
  // to avoid retry loops when initialisation fails.
  const autoInitKey = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== "edit" || !selectedProviderId || session || isSaving) return;
    const key = `${selectedProviderId}:${cart.total}`;
    if (autoInitKey.current === key) return;
    autoInitKey.current = key;
    startSession(selectedProviderId);
  }, [mode, selectedProviderId, session, isSaving, cart.total, startSession]);

  const completeOrder = async (pendingPaymentRetries = 0) => {
    setIsPlacing(true);
    setError("");
    try {
      const result = await placeOrder(cart.id, { pendingPaymentRetries });
      if (result.type === "order") {
        goToOrderConfirmation(countryCode, result.order);
        return; // keep the "placing" state while navigating away
      }
      setError(
        result.type === "pending"
          ? "Deine Zahlung wird noch bestätigt. Bitte lade die Seite in einem Moment neu."
          : result.message || ORDER_FAILED,
      );
    } catch (err) {
      console.error("Failed to place order:", err);
      setError(ORDER_FAILED);
    }
    setIsPlacing(false);
  };

  const handleSumUpResponse = (type: SumUpResponseType, body: Record<string, unknown>) => {
    switch (type) {
      case "sent":
      case "auth-screen":
        setIsProcessing(true);
        setError("");
        break;
      case "success":
        setIsProcessing(false);
        // SumUp may report success slightly before the checkout is PAID.
        completeOrder(3);
        break;
      case "error":
      case "fail":
        console.warn(`SumUp payment ${type}:`, body);
        setIsProcessing(false);
        setPaymentFailed(true);
        setError(
          type === "fail"
            ? "Zahlung abgebrochen oder abgelaufen."
            : "Zahlung fehlgeschlagen.",
        );
        break;
    }
  };

  if (mode === "inactive") {
    return <CheckoutStep number={3} title="Zahlung" state="inactive" />;
  }

  return (
    <CheckoutStep number={3} title="Zahlung" state="active">
      {isLoading && (
        <p className="text-sm mb-4 text-muted">Zahlungsoptionen werden geladen...</p>
      )}

      {!isLoading && paymentProviders.length === 0 && !error && (
        <p className="text-sm mb-4 text-muted">Keine Zahlungsoptionen verfügbar.</p>
      )}

      {!isLoading && paymentProviders.length > 0 && (
        <div className="space-y-3 mb-6">
          {paymentProviders.map((provider) => (
            <OptionCard
              key={provider.id}
              name="payment_provider"
              value={provider.id}
              checked={selectedProviderId === provider.id}
              disabled={isSaving || isPlacing || isProcessing}
              onSelect={handleProviderChange}
            >
              {formatProviderName(provider.id)}
              {isTestProvider(provider.id) && (
                <span
                  className="badge"
                  style={{
                    fontSize: "0.7rem",
                    background: "var(--color-earth-light)",
                    borderColor: "var(--color-earth)",
                    color: "var(--color-earth)",
                  }}
                >
                  Nur zum Testen
                </span>
              )}
            </OptionCard>
          ))}
        </div>
      )}

      {isSumUp && (
        <div className="mb-6">
          {isSaving || (!sumupCheckoutId && !error) ? (
            <p className="text-sm text-muted">Zahlung wird initialisiert...</p>
          ) : (
            sumupCheckoutId &&
            !paymentFailed && (
              <>
                <p className="text-sm font-medium mb-3 font-mono">
                  Zahlungsmethode auswählen
                </p>
                <SumUpWidget
                  key={sumupCheckoutId}
                  checkoutId={sumupCheckoutId}
                  onResponse={handleSumUpResponse}
                  onLoadError={() =>
                    setError("Zahlungswidget konnte nicht geladen werden. Bitte Seite neu laden.")
                  }
                />
              </>
            )
          )}
          {isProcessing && <p className="text-sm mt-2 text-muted">Zahlung wird verarbeitet…</p>}
          {isPlacing && <p className="text-sm mt-2 text-muted">Bestellung wird aufgegeben…</p>}
        </div>
      )}

      {error && <p className="input-error mb-4">{error}</p>}

      {selectedProviderId && (
        <p className="text-xs text-muted mb-4">
          Mit deiner Bestellung akzeptierst du unsere{" "}
          <a href={`/${countryCode}/agb`} target="_blank" className="underline">AGB</a>{" "}
          und hast die{" "}
          <a href={`/${countryCode}/widerruf`} target="_blank" className="underline">
            Widerrufsbelehrung
          </a>{" "}
          sowie die{" "}
          <a href={`/${countryCode}/datenschutz`} target="_blank" className="underline">
            Datenschutzerklärung
          </a>{" "}
          zur Kenntnis genommen.
        </p>
      )}

      {isSumUp && paymentFailed && (
        <button
          type="button"
          onClick={() => startSession(selectedProviderId)}
          disabled={isSaving}
          className="btn-accent w-full"
        >
          Erneut versuchen
        </button>
      )}

      {/* SumUp submits through its own widget button */}
      {!isSumUp && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={!session || isSaving || isPlacing}
            onClick={() => completeOrder()}
            className="btn-accent w-full"
          >
            {isPlacing ? "Wird verarbeitet..." : "Zahlungspflichtig bestellen"}
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="trust-badge">🔒 Sichere Zahlung</span>
            <span className="trust-badge">✓ SSL-verschlüsselt</span>
          </div>
        </div>
      )}
    </CheckoutStep>
  );
};
