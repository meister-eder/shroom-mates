import { convertToLocale } from "@lib/utils/money";
import { stickerColor, stickerColorVar } from "@lib/utils/product-color";

interface SummaryLineProps {
  title: string;
  subtitle?: string | null;
  handle?: string | null;
  thumbnail?: string | null;
  quantity: number;
  unitPrice: number;
  currencyCode: string;
}

/** Position in der Bestellübersicht: 60px-Bild mit Kartonfarbe, Name, "2 × 24,95 €", Summe. */
export const SummaryLine = ({
  title,
  subtitle,
  handle,
  thumbnail,
  quantity,
  unitPrice,
  currencyCode,
}: SummaryLineProps) => {
  const color = stickerColorVar(stickerColor({ handle, title }));
  const fmt = (amount: number) => convertToLocale({ amount, currencyCode });

  return (
    <div className="sline">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          className="sline-thumb"
          style={{ borderColor: color }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="sline-thumb sline-thumb--empty"
          style={{ borderColor: color, background: color }}
        />
      )}
      <div className="sline-body">
        <p className="sline-title">{title}</p>
        <p className="shop-meta">
          {subtitle && subtitle !== "Standard" && `${subtitle} · `}
          {quantity} × {fmt(unitPrice)}
        </p>
      </div>
      <span className="shop-mono">{fmt(unitPrice * quantity)}</span>
    </div>
  );
};
