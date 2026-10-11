import { useEffect, useRef } from "react";

export type SumUpResponseType =
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
      }): { unmount?: () => void } | void;
    };
  }
}

const SUMUP_SDK_URL = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
const SUMUP_WIDGET_ID = "sumup-card-widget";

let sdkPromise: Promise<void> | null = null;

function loadSumUpSdk(): Promise<void> {
  if (window.SumUpCard) return Promise.resolve();
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SUMUP_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Allow a later mount to try again.
      sdkPromise = null;
      script.remove();
      reject(new Error("Failed to load SumUp SDK"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

interface SumUpWidgetProps {
  checkoutId: string;
  onResponse: (type: SumUpResponseType, body: Record<string, unknown>) => void;
  onLoadError: () => void;
}

/**
 * Mounts the SumUp Card Widget for a checkout while this component is
 * rendered, and tears it down on unmount or when the checkout ID changes.
 * The widget shows every payment method enabled on the SumUp merchant
 * account (SumUp Dashboard → Settings → Payment Methods).
 */
export const SumUpWidget = ({
  checkoutId,
  onResponse,
  onLoadError,
}: SumUpWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest callbacks without remounting the widget.
  const callbacks = useRef({ onResponse, onLoadError });
  callbacks.current = { onResponse, onLoadError };

  useEffect(() => {
    const container = containerRef.current;
    let cancelled = false;
    let instance: { unmount?: () => void } | void;

    loadSumUpSdk()
      .then(() => {
        if (cancelled || !container || !window.SumUpCard) return;
        container.innerHTML = "";
        instance = window.SumUpCard.mount({
          id: SUMUP_WIDGET_ID,
          checkoutId,
          locale: "de-DE",
          onResponse: (type, body) => callbacks.current.onResponse(type, body),
        });
      })
      .catch(() => {
        if (!cancelled) callbacks.current.onLoadError();
      });

    return () => {
      cancelled = true;
      instance?.unmount?.();
      if (container) container.innerHTML = "";
    };
  }, [checkoutId]);

  return <div id={SUMUP_WIDGET_ID} ref={containerRef} className="min-h-[200px]" />;
};
