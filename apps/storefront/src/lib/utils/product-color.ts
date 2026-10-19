/**
 * Kartonfarbe (Growkit-Karton) je Produkt für StickerCards und Rahmen.
 * Zuordnung nach Handle/Titel; unbekannte Produkte bekommen "paper".
 */
export type StickerColor =
  | "lavender"
  | "pink"
  | "olive-soft"
  | "stone"
  | "paper";

export function stickerColor(product: {
  handle?: string | null;
  title?: string | null;
}): StickerColor {
  const key = `${product.handle ?? ""} ${product.title ?? ""}`.toLowerCase();
  if (key.includes("black pearl") || key.includes("black-pearl"))
    return "stone";
  if (key.includes("rosen")) return "pink";
  if (key.includes("reishi") || key.includes("cordyceps")) return "pink";
  if (key.includes("lion")) return "lavender";
  if (key.includes("white pearl") || key.includes("white-pearl"))
    return "olive-soft";
  if (key.includes("auster") || key.includes("tinktur")) return "olive-soft";
  return "paper";
}

/** CSS-Variable der Kartonfarbe (für Inline-Rahmen) */
export const stickerColorVar = (color: StickerColor): string =>
  `var(--color-${color})`;
