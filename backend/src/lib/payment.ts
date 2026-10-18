export const MANUAL_PROVIDER_ID = "pp_system_default";

/**
 * "Manuelle Zahlung (Test)" completes without any payment. Only allow it
 * outside production, or where it is explicitly enabled (test/staging).
 */
export const manualPaymentAllowed = () =>
  process.env.NODE_ENV !== "production" || process.env.ALLOW_MANUAL_PAYMENT === "true";
