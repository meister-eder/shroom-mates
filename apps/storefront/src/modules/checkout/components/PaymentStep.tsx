import { sdk } from "@lib/sdk";
import { completeCart, initPaymentSession } from "@lib/stores/cart";
import type { StoreCart, StorePaymentProvider } from "@medusajs/types";
import { useCallback, useEffect, useRef, useState } from "react";

type SumUpResponseType =
  | "sent"
  | "invalid"
  | "auth-screen"
  | "error"
  | "success"
  | "fail";

declare global {
  interface Window {
    SumUpCard?: {
      mount(config: {
        id: string;
        checkoutId: string;
        locale?: string;
        showSubmitButton?: boolean;
        onLoad?: () => void;
        onResponse?: (type: SumUpResponseType, body: Record<string, unknown>) => void;
      }): void;
    };
  }
}

const SUMUP_SDK_URL = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
const SUMUP_WIDGET_ID = "sumup-card-widget";

interface PaymentStepProps {
  cart: StoreCart;
  countryCode: string;
  mode: "edit" | "inactive";
  onEdit?: () => void;
}

function formatProviderName(providerId: string): string {
  if (providerId === "pp_system_default") return "Manuelle Zahlung (Test)";
  if (providerId.includes("sumup")) return "Online bezahlen (SumUp)";
  return providerId
    .replace(/^pp_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isTestProvider(providerId: string): boolean {
  return providerId === "pp_system_default";
}

function isSumUpProvider(providerId: string): boolean {
  return providerId.includes("sumup");
}

export const PaymentStep = ({
  cart,
  countryCode,
  mode,
}: PaymentStepProps) => {
  const [paymentProviders, setPaymentProviders] = useState<StorePaymentProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const sumupMountedRef = useRef<string | null>(null);

  // Derive SumUp checkout ID from the cart's payment session
  const sumupCheckoutId = isSumUpProvider(selectedProviderId) && !isSaving
    ? (cart.payment_collection?.payment_sessions?.find(
      (s) => isSumUpProvider(s.provider_id ?? ""),
    )?.data?.id as string | undefined)
    : undefined;

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

        const existingProviderId =
          cart.payment_collection?.payment_sessions?.[0]?.provider_id;
        if (existingProviderId) {
          setSelectedProviderId(existingProviderId);
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

  const handleProviderChange = async (providerId: string) => {
    if (isSaving) return;
    sumupMountedRef.current = null;
    setSelectedProviderId(providerId);
    setIsSaving(true);
    setError("");
    try {
      await initPaymentSession(providerId);
    } catch (err) {
      console.error("Failed to initialize payment session:", err);
      setError("Zahlungsmethode konnte nicht gesetzt werden. Bitte versuche es erneut.");
      const savedProviderId =
        cart.payment_collection?.payment_sessions?.[0]?.provider_id ?? "";
      setSelectedProviderId(savedProviderId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderComplete = useCallback(async () => {
    setIsPlacing(true);
    setError("");
    try {
      const result = await completeCart();
      if (result.type === "order") {
        try {
          sessionStorage.setItem("medusa_order", JSON.stringify(result.order));
        } catch { }
        window.location.href = `/${countryCode}/order/${result.order.id}`;
      } else if (result.type === "already_completed") {
        window.location.href = `/${countryCode}/order/confirmed`;
      } else {
        setError(result.error.message || "Bestellung konnte nicht aufgegeben werden. Bitte versuche es erneut.");
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      setError("Bestellung konnte nicht aufgegeben werden. Bitte versuche es erneut.");
    } finally {
      setIsPlacing(false);
    }
  }, [countryCode]);

  // Load SumUp Card Widget and mount when checkout ID is available.
  // The widget shows all payment methods enabled on your SumUp merchant account
  // (credit/debit cards, Apple Pay, Google Pay, PayPal, iDEAL, etc.).
  // To enable more methods, go to SumUp Dashboard → Settings → Payment Methods.
  useEffect(() => {
    if (!sumupCheckoutId) return;
    if (sumupMountedRef.current === sumupCheckoutId) return;

    const mount = () => {
      const container = document.getElementById(SUMUP_WIDGET_ID);
      if (!container || !window.SumUpCard) return;
      container.innerHTML = "";
      sumupMountedRef.current = sumupCheckoutId;
      window.SumUpCard.mount({
        id: SUMUP_WIDGET_ID,
        checkoutId: sumupCheckoutId,
        locale: "de-DE",
        onLoad: () => {
          console.log("SumUp card widget loaded");
        },
        onResponse: (type, body) => {
          switch (type) {
            case "sent":
              setIsProcessing(true);
              setError("");
              break;
            case "auth-screen":
              setIsProcessing(true);
              setError("");
              break;
            case "success":
              setIsProcessing(false);
              handleOrderComplete();
              break;
            case "error":
              console.error("SumUp payment error:", body);
              setIsProcessing(false);
              setError("Zahlung fehlgeschlagen. Bitte versuche es erneut.");
              sumupMountedRef.current = null;
              break;
            case "fail":
              console.warn("SumUp payment failed/cancelled:", body);
              setIsProcessing(false);
              setError("Zahlung abgebrochen oder abgelaufen. Bitte versuche es erneut.");
              sumupMountedRef.current = null;
              break;
            case "invalid":
              break;
          }
        },
      });
    };

    if (window.SumUpCard) {
      mount();
      return;
    }

    if (!document.getElementById("sumup-sdk-script")) {
      const script = document.createElement("script");
      script.id = "sumup-sdk-script";
      script.src = SUMUP_SDK_URL;
      script.onload = mount;
      script.onerror = () => {
        setError("Zahlungswidget konnte nicht geladen werden. Bitte Seite neu laden.");
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.SumUpCard) {
          clearInterval(interval);
          mount();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [sumupCheckoutId, handleOrderComplete]);

  if (mode === "inactive") {
    return (
      <div className="checkout-step" style={{ opacity: 0.5 }}>
        <div className="checkout-step-header">
          <div className="checkout-step-number">3</div>
          <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem", color: "var(--text-muted)" }}>
            Zahlung
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-step">
      <div className="checkout-step-header">
        <div className="checkout-step-number active">3</div>
        <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem" }}>
          Zahlung
        </h2>
      </div>

      <div className="checkout-step-body">
        {isLoading && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Zahlungsoptionen werden geladen...</p>
        )}

        {!isLoading && paymentProviders.length === 0 && !error && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Keine Zahlungsoptionen verfügbar.
          </p>
        )}

        {!isLoading && paymentProviders.length > 0 && (
          <div className="space-y-3 mb-6">
            {paymentProviders.map((provider) => (
              <label
                key={provider.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                style={{
                  border: `1.5px solid ${selectedProviderId === provider.id ? "var(--accent, #ff4908)" : "#e2ddd6"}`,
                  borderRadius: 8,
                  background: selectedProviderId === provider.id ? "#fff9f5" : "#fff",
                  boxShadow: selectedProviderId === provider.id ? "0 0 0 1px var(--accent, #ff4908)" : "none",
                }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment_provider"
                    value={provider.id}
                    checked={selectedProviderId === provider.id}
                    onChange={() => handleProviderChange(provider.id)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-sm font-medium">
                    {formatProviderName(provider.id)}
                  </span>
                  {isTestProvider(provider.id) && (
                    <span className="badge" style={{ fontSize: "0.7rem", background: "var(--color-earth-light)", borderColor: "var(--color-earth)", color: "var(--color-earth)" }}>
                      Nur zum Testen
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {/* SumUp Card Widget — shows all payment methods enabled on the SumUp account.
            To enable PayPal, Apple Pay, Google Pay etc., go to:
            SumUp Dashboard → Settings → Payment Methods */}
        {isSumUpProvider(selectedProviderId) && (
          <div className="mb-6">
            {isSaving && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Zahlung wird initialisiert...</p>
            )}
            {!isSaving && (
              <p className="text-sm font-medium mb-3" style={{ fontFamily: '"DM Mono", monospace' }}>
                Zahlungsmethode auswählen
              </p>
            )}
            {!isSaving && !sumupCheckoutId && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Kartenformular wird geladen...</p>
            )}
            <div id={SUMUP_WIDGET_ID} className="min-h-[200px]" />
            {isProcessing && (
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Zahlung wird verarbeitet…</p>
            )}
            {isPlacing && (
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Bestellung wird aufgegeben…</p>
            )}
          </div>
        )}

        {error && <p className="input-error mb-4">{error}</p>}

        {/* Place Order button for non-SumUp providers; SumUp uses its own submit button */}
        {!isSumUpProvider(selectedProviderId) && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={!selectedProviderId || isSaving || isPlacing}
              onClick={handleOrderComplete}
              className="btn-accent w-full"
            >
              {isPlacing ? "Wird verarbeitet..." : "Bestellung aufgeben"}
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="trust-badge">🔒 Sichere Zahlung</span>
              <span className="trust-badge">✓ SSL-verschlüsselt</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
