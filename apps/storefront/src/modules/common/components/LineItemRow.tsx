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
  <div className="line-row">
    {thumbnail ? (
      <img src={thumbnail} alt={title} className="line-item-thumb" loading="lazy" />
    ) : (
      <div className="line-item-thumb" />
    )}
    <div className="line-row__body">
      <p className="line-row__name">{title}</p>
      {subtitle && subtitle !== "Standard" && (
        <p className="line-row__meta">{subtitle}</p>
      )}
      <div className="line-row__sum">
        <span className="line-row__meta">
          {quantity}× {convertToLocale({ amount: unitPrice, currencyCode })}
        </span>
        <span className="line-row__total">
          {convertToLocale({ amount: unitPrice * quantity, currencyCode })}
        </span>
      </div>
    </div>
  </div>
);
