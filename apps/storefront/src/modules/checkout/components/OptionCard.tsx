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
    className={`option-card${checked ? " selected" : ""}${disabled ? " disabled" : ""}`}
  >
    <span className="flex items-center gap-3 text-sm font-medium">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="w-4 h-4 accent-black"
      />
      {children}
    </span>
    {aside}
  </label>
);
