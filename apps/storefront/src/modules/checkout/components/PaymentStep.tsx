import {
  formatProviderName,
  isSumUpProvider,
  isTestProvider,
} from "@lib/checkout/payment-providers";
import { goToOrderConfirmation } from "@lib/checkout/order-handoff";
import { sdk } from "@lib/sdk";
import { convertToLocale } from "@lib/utils/money";
import { initPaymentSession, placeOrder } from "@lib/stores/cart";
import type { StoreCart, StorePaymentProvider } from "@medusajs/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckoutStep } from "./CheckoutStep";
import { ERROR_CLASS } from "./AddressFields";
import { OptionCard } from "./OptionCard";
import { OrderReview } from "./OrderReview";
import { type SumUpCardHandle, SumUpWidget, type SumUpResponseType } from "./SumUpWidget";

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
  const [sumupCard, setSumupCard] = useState<SumUpCardHandle | null>(null);

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
    return (
      <>
        <CheckoutStep number={3} title="Zahlung" state="inactive" />
        <CheckoutStep number={4} title="Prüfen & bestellen" state="inactive" />
      </>
    );
  }

  const errorMessage = error && (
    <p className={`${ERROR_CLASS} mb-4`} role="alert">
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
        {isLoading && <p className="mb-4 text-muted">Zahlungsoptionen werden geladen...</p>}

        {!isLoading && paymentProviders.length === 0 && !error && (
          <p className="mb-4 text-muted">Keine Zahlungsoptionen verfügbar.</p>
        )}

        {!isLoading && paymentProviders.length > 0 && (
          <div className="mb-3.5 flex flex-col gap-3">
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
                  <span className="rounded-pill border-2 border-ink bg-lavender px-2 py-0.5 font-mono text-xs font-medium">
                    Nur zum Testen
                  </span>
                )}
              </OptionCard>
            ))}
          </div>
        )}

        {isSumUp && (
          <div className="rounded-none border-2 border-dashed border-ink bg-cream p-5 sm:p-7">
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
                    setError("Zahlungswidget konnte nicht geladen werden. Bitte Seite neu laden.")
                  }
                />
              )
            )}
            {isProcessing && <p className="mt-2 text-muted">Zahlung wird verarbeitet…</p>}
            {isPlacing && <p className="mt-2 text-muted">Bestellung wird aufgegeben…</p>}
          </div>
        )}

        {!selectedProviderId && errorMessage}

        {isSumUp && paymentFailed && (
          <button
            type="button"
            onClick={() => startSession(selectedProviderId)}
            disabled={isSaving}
            className="btn btn--secondary btn--block mt-4"
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
          <div className="grid gap-4">
            <OrderReview cart={cart} countryCode={countryCode} />

            <p className="m-0 text-[15px] leading-relaxed">
              Es gelten unsere{" "}
              <a href={`/${countryCode}/agb`} target="_blank" className="text-accent-dark underline hover:text-ink">AGB</a>.
              Informationen zu deinem{" "}
              <a href={`/${countryCode}/widerruf`} target="_blank" className="text-accent-dark underline hover:text-ink">Widerrufsrecht</a>{" "}
              und zum{" "}
              <a href={`/${countryCode}/datenschutz`} target="_blank" className="text-accent-dark underline hover:text-ink">Datenschutz</a>.
              Dein Zahlungsmittel wird mit Absenden der Bestellung belastet.
            </p>

            <a
              href={`/${countryCode}/gewaehrleistung`}
              target="_blank"
              className="flex items-center gap-4 rounded-none border-2 border-ink bg-cream p-3 text-[14px] leading-snug text-ink! no-underline [&:hover_strong]:underline"
              aria-label="EU-Mitteilung: Ihre gesetzlichen Gewährleistungsrechte (öffnet in neuem Tab)"
            >
              <img
                src="/legal/gesetzliche-gewaehrleistung.jpg"
                alt=""
                width="96"
                height="131"
                className="h-auto w-16 shrink-0 border-2 border-ink"
              />
              <span>
                <strong>Gesetzliche Gewährleistung</strong>
                <br />
                Mindestens zwei Jahre für Waren, die in der EU verkauft werden. Mehr erfahren
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
              className="btn btn--primary btn--block min-h-[62px] text-xl font-extrabold shadow-none!"
            >
              {isPlacing || isProcessing
                ? "Wird verarbeitet..."
                : `Zahlungspflichtig bestellen · ${orderTotal}`}
            </button>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[13px]">
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                Sichere Zahlung
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
