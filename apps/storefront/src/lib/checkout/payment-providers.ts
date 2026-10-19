export const SYSTEM_PROVIDER_ID = "pp_system_default";

export function isSumUpProvider(
  providerId: string | null | undefined,
): boolean {
  return !!providerId?.startsWith("pp_sumup");
}

export function isTestProvider(providerId: string | null | undefined): boolean {
  return providerId === SYSTEM_PROVIDER_ID;
}

export function formatProviderName(providerId: string): string {
  if (isTestProvider(providerId)) return "Manuelle Zahlung (Test)";
  if (isSumUpProvider(providerId)) return "Online bezahlen (SumUp)";
  return providerId
    .replace(/^pp_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
