/**
 * Event tracking for the self-hosted Umami (cookieless). Only product handle,
 * variant, quantity and amounts are ever passed here: no order IDs, e-mail
 * addresses or other personal data.
 *
 * `window.umami` exists only when the tracker script is on the page (build-time
 * env PUBLIC_UMAMI_WEBSITE_ID); without it every call is a no-op.
 */
type EventData = Record<string, string | number | boolean>;

interface UmamiTracker {
  track: (name: string, data?: EventData) => void;
}

export function track(name: string, data?: EventData): void {
  if (typeof window === "undefined") return;
  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  try {
    umami?.track(name, data);
  } catch {
    // Analytics must never break the shop.
  }
}
