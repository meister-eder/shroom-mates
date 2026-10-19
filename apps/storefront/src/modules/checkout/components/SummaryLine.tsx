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
  const thumbClass = "box-border h-[60px] w-[60px] shrink-0 rounded-none border-[3px] object-cover";

  return (
    <div className="flex items-center gap-3">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          className={thumbClass}
          style={{ borderColor: color }}
        />
      ) : (
        <div
          aria-hidden="true"
          className={thumbClass}
          style={{ borderColor: color, background: color }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 font-bold">{title}</p>
        <p className="m-0 font-mono text-xs">
          {subtitle && subtitle !== "Standard" && `${subtitle} · `}
          {quantity} × {fmt(unitPrice)}
        </p>
      </div>
      <span className="font-mono">{fmt(unitPrice * quantity)}</span>
    </div>
  );
};
