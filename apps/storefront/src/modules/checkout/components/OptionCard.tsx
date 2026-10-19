import type { ReactNode } from "react";

interface OptionCardProps {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: (value: string) => void;
  children: ReactNode;
  aside?: ReactNode;
}

/** Radio button styled as a selectable card (shipping / payment options). */
export const OptionCard = ({
  name,
  value,
  checked,
  disabled,
  onSelect,
  children,
  aside,
}: OptionCardProps) => (
  <label
    className={`optcard${checked ? " optcard--checked" : ""}${
      disabled ? " optcard--disabled" : ""
    }`}
  >
    <span className="optcard-label">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="optcard-radio"
      />
      {children}
    </span>
    {aside}
  </label>
);
