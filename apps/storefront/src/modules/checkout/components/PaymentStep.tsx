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

const CardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-gray-400"
    aria-hidden="true"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

function formatProviderName(providerId: string): string {
  if (providerId === "pp_system_default") return "Manual Payment";
  if (providerId.includes("sumup")) return "Kreditkarte (SumUp)";
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
  const sumupMountedRef = useRef<string | null>(null); // tracks which checkoutId is currently mounted

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
        setError("Failed to load payment options. Please try again.");
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
      setError("Failed to set payment method. Please try again.");
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
        setError(result.error.message || "Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  }, [countryCode]);

  // Load SumUp SDK and mount widget when checkout ID is available
  useEffect(() => {
    if (!sumupCheckoutId) return;
    // Don't remount if already mounted for the same checkout ID
    if (sumupMountedRef.current === sumupCheckoutId) return;

    const mount = () => {
      const container = document.getElementById(SUMUP_WIDGET_ID);
      if (!container || !window.SumUpCard) return;
      // Clear previous widget content
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
              // Form submitted to SumUp server for processing
              setIsProcessing(true);
              setError("");
              break;
            case "auth-screen":
              // 3DS challenge is being displayed within the widget
              setIsProcessing(true);
              setError("");
              break;
            case "success":
              // Payment completed — verify on backend via completeCart
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
              // User cancelled or session timed out
              console.warn("SumUp payment failed/cancelled:", body);
              setIsProcessing(false);
              setError("Zahlung abgebrochen oder abgelaufen. Bitte versuche es erneut.");
              sumupMountedRef.current = null;
              break;
            case "invalid":
              // Form validation errors — widget handles display, no action needed
              break;
          }
        },
      });
    };

    if (window.SumUpCard) {
      mount();
      return;
    }

    // Load SDK script if not already present
    if (!document.getElementById("sumup-sdk-script")) {
      const script = document.createElement("script");
      script.id = "sumup-sdk-script";
      script.src = SUMUP_SDK_URL;
      script.onload = mount;
      script.onerror = () => {
        setError("Failed to load payment widget. Please refresh and try again.");
      };
      document.head.appendChild(script);
    } else {
      // Script tag exists but SDK not ready yet — wait for it
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

  const isSumUp = isSumUpProvider(selectedProviderId);

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
                  border: `2px solid ${selectedProviderId === provider.id ? "var(--accent, #ff4908)" : "#000"}`,
                  borderRadius: 8,
                  background: selectedProviderId === provider.id ? "var(--bg-accent, #fdfcea)" : "#fff",
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
                <CardIcon />
              </label>
            ))}
          </div>
        )}

        {/* SumUp embedded card widget */}
        {isSumUp && (
          <div className="mb-6">
            {isSaving && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Zahlung wird initialisiert...</p>
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

        {/* Show Place Order button only for non-SumUp providers */}
        {!isSumUp && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={!selectedProviderId || isSaving || isPlacing}
              onClick={handleOrderComplete}
              className="text-white py-3 px-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--accent, #ff4908)",
                border: "2px solid #000",
                fontFamily: '"DM Mono", monospace',
                fontWeight: 700,
              }}
            >
              {isPlacing ? "Wird verarbeitet..." : "Bestellung aufgeben"}
            </button>
            <div className="flex items-center gap-2">
              <span className="trust-badge">🔒 Sichere Zahlung</span>
              <span className="trust-badge">✓ SSL-verschlüsselt</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
