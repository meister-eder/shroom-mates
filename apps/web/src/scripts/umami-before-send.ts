/**
 * Umami `data-before-send` hook: strips personal IDs from the URLs that leave
 * the browser. `/shop/order/<id>/` becomes `/shop/order/`; query strings and
 * hashes (e.g. the SumUp return parameters on checkout/complete) are dropped.
 *
 * Umami requires the handler to be a function on `window` that exists before
 * the tracker sends its first request (documented tracker API, so this is the
 * one deliberate global). The module is loaded before the tracker tag.
 */
export function normalizeUrl(value: unknown): unknown {
  if (typeof value !== "string" || value === "") return value;
  try {
    const url = new URL(value, window.location.origin);
    const path = url.pathname.replace(/^(\/shop\/order\/)[^/]+.*$/, "$1");
    // Relative input (Umami sends paths and same-origin referrers) stays relative
    return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")
      ? `${url.origin}${path}`
      : path;
  } catch {
    return value;
  }
}

export function beforeSend(
  _type: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...payload,
    url: normalizeUrl(payload.url),
    referrer: normalizeUrl(payload.referrer),
  };
}

(window as unknown as Record<string, unknown>).umamiBeforeSend = beforeSend;
