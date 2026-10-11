import { convertToLocale } from "@lib/utils/money";

interface LineItemRowProps {
  title: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  quantity: number;
  unitPrice: number;
  currencyCode: string;
}

export const LineItemRow = ({
  title,
  subtitle,
  thumbnail,
  quantity,
  unitPrice,
  currencyCode,
}: LineItemRowProps) => (
  <div className="flex gap-3 py-2">
    {thumbnail ? (
      <img src={thumbnail} alt={title} className="line-item-thumb" loading="lazy" />
    ) : (
      <div className="line-item-thumb" />
    )}
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate">{title}</p>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      <div className="flex justify-between mt-1 text-sm">
        <span className="text-muted">
          {quantity}× {convertToLocale({ amount: unitPrice, currencyCode })}
        </span>
        <span className="font-medium">
          {convertToLocale({ amount: unitPrice * quantity, currencyCode })}
        </span>
      </div>
    </div>
  </div>
);
