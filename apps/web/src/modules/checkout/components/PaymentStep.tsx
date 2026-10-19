import { goToOrderConfirmation } from "@lib/checkout/order-handoff";
import {
  formatProviderName,
  isSumUpProvider,
  isTestProvider,
} from "@lib/checkout/payment-providers";
import { storeApi } from "@lib/store-api";
import { initPaymentSession, placeOrder } from "@lib/stores/cart";
import { convertToLocale } from "@lib/utils/money";
import type { StoreCart, StorePaymentProvider } from "@medusajs/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { ERROR_CLASS } from "./AddressFields";
import { CheckoutStep } from "./CheckoutStep";
import { OptionCard } from "./OptionCard";
import { OrderReview } from "./OrderReview";
import {
  type SumUpCardHandle,
  type SumUpResponseType,
  SumUpWidget,
} from "./SumUpWidget";

interface PaymentStepProps {
  cart: StoreCart;
  countryCode: string;
  mode: "edit" | "inactive";
}

const ORDER_FAILED =
  "Bestellung konnte nicht aufgegeben werden. Bitte versuche es erneut.";

export const PaymentStep = ({ cart, countryCode, mode }: PaymentStepProps) => {
  const [paymentProviders, setPaymentProviders] = useState<
    StorePaymentProvider[]
  >([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [error, setError] = useState("");
  const [sumupCard, setSumupCard] = useState<SumUpCardHandle | null>(null);

  const sessions = cart.payment_collection?.payment_sessions ?? [];
  const session = sessions.find((s) => s.provider_id === selectedProviderId);
  const isSumUp = isSumUpProvider(selectedProviderId);
  const sumupCheckoutId =
    isSumUp && !isSaving
      ? (session?.data?.id as string | undefined)
      : undefined;

  // biome-ignore lint/correctness/useExhaustiveDependencies: läuft bewusst nur bei den genannten Abhängigkeiten
  useEffect(() => {
    if (mode !== "edit") return;

    const fetchProviders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { payment_providers } =
          await storeApi.payment.listPaymentProviders({
            region_id: cart.region_id!,
          });
        setPaymentProviders(payment_providers);

        const existingProviderId = sessions[0]?.provider_id;
        if (existingProviderId) {
          setSelectedProviderId((current) => current || existingProviderId);
        }
      } catch (err) {
        console.error("Failed to load payment providers:", err);
        setError(
          "Zahlungsoptionen konnten nicht geladen werden. Bitte versuche es erneut.",
        );
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
        setError(
          "Zahlungsmethode konnte nicht gesetzt werden. Bitte versuche es erneut.",
        );
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

  const handleSumUpResponse = (
    type: SumUpResponseType,
    body: Record<string, unknown>,
  ) => {
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
    return (
      <>
        <CheckoutStep number={3} title="Zahlung" state="inactive" />
        <CheckoutStep number={4} title="Prüfen & bestellen" state="inactive" />
      </>
    );
  }

  const errorMessage = error && (
    <p className={`${ERROR_CLASS} checkout-error--spaced`} role="alert">
      {error}
    </p>
  );
  const orderTotal = convertToLocale({
    amount: cart.total ?? 0,
    currencyCode: cart.currency_code || "EUR",
  });

  return (
    <>
      <CheckoutStep number={3} title="Zahlung" state="active">
        {isLoading && (
          <p className="checkout-note">Zahlungsoptionen werden geladen...</p>
        )}

        {!isLoading && paymentProviders.length === 0 && !error && (
          <p className="checkout-note">Keine Zahlungsoptionen verfügbar.</p>
        )}

        {!isLoading && paymentProviders.length > 0 && (
          <div className="checkout-options">
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
                  <span className="pay-test-pill">Nur zum Testen</span>
                )}
              </OptionCard>
            ))}
          </div>
        )}

        {isSumUp && (
          <div className="pay-box">
            {isSaving || (!sumupCheckoutId && !error) ? (
              <p className="text-muted">Zahlung wird initialisiert...</p>
            ) : (
              sumupCheckoutId &&
              !paymentFailed && (
                <SumUpWidget
                  key={sumupCheckoutId}
                  checkoutId={sumupCheckoutId}
                  onResponse={handleSumUpResponse}
                  onReady={setSumupCard}
                  onLoadError={() =>
                    setError(
                      "Zahlungswidget konnte nicht geladen werden. Bitte Seite neu laden.",
                    )
                  }
                />
              )
            )}
            {isProcessing && (
              <p className="pay-status">Zahlung wird verarbeitet…</p>
            )}
            {isPlacing && (
              <p className="pay-status">Bestellung wird aufgegeben…</p>
            )}
          </div>
        )}

        {!selectedProviderId && errorMessage}

        {isSumUp && paymentFailed && (
          <button
            type="button"
            onClick={() => startSession(selectedProviderId)}
            disabled={isSaving}
            className="btn btn--secondary btn--block pay-retry"
          >
            Neue Zahlung starten
          </button>
        )}
      </CheckoutStep>

      <CheckoutStep
        number={4}
        title="Prüfen & bestellen"
        state={selectedProviderId ? "active" : "inactive"}
      >
        {selectedProviderId && (
          <div className="review-grid">
            <OrderReview cart={cart} countryCode={countryCode} />

            <p className="review-legal">
              Es gelten unsere{" "}
              <a
                href={`/${countryCode}/agb`}
                target="_blank"
                className="shop-link"
              >
                AGB
              </a>
              . Informationen zu deinem{" "}
              <a
                href={`/${countryCode}/widerruf`}
                target="_blank"
                className="shop-link"
              >
                Widerrufsrecht
              </a>{" "}
              und zum{" "}
              <a
                href={`/${countryCode}/datenschutz`}
                target="_blank"
                className="shop-link"
              >
                Datenschutz
              </a>
              . Dein Zahlungsmittel wird mit Absenden der Bestellung belastet.
            </p>

            <a
              href={`/${countryCode}/gewaehrleistung`}
              target="_blank"
              className="warranty-link"
              aria-label="EU-Mitteilung: Ihre gesetzlichen Gewährleistungsrechte (öffnet in neuem Tab)"
            >
              <img
                src="/legal/gesetzliche-gewaehrleistung.jpg"
                alt=""
                width="96"
                height="131"
              />
              <span>
                <strong>Gesetzliche Gewährleistung</strong>
                <br />
                Mindestens zwei Jahre für Waren, die in der EU verkauft werden.
                Mehr erfahren
              </span>
            </a>

            {errorMessage}

            {/* One binding button for every payment method (§ 312j Abs. 3 BGB).
                For SumUp it submits the card widget, whose own button is hidden. */}
            <button
              type="button"
              disabled={
                !session ||
                isSaving ||
                isPlacing ||
                isProcessing ||
                paymentFailed ||
                (isSumUp && !sumupCard)
              }
              onClick={() => (isSumUp ? sumupCard?.submit() : completeOrder())}
              className="btn btn--primary btn--block btn--flat"
            >
              {isPlacing || isProcessing
                ? "Wird verarbeitet..."
                : `Zahlungspflichtig bestellen · ${orderTotal}`}
            </button>
            <div className="pay-trust">
              <span>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                Sichere Zahlung
              </span>
              <span>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                SSL-verschlüsselt
              </span>
            </div>
          </div>
        )}
      </CheckoutStep>
    </>
  );
};
