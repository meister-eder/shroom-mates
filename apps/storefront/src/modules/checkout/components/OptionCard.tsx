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
    className={`flex items-center justify-between gap-4 rounded-none border-2 border-accent px-[18px] py-4 focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-accent ${
      checked ? "bg-cream shadow-[4px_4px_0_var(--color-accent)]" : "bg-white"
    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <span className="flex min-w-0 items-center gap-4 text-lg font-bold">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="m-0 h-[22px] w-[22px] shrink-0 cursor-[inherit] appearance-none rounded-full border-2 border-accent bg-white checked:bg-ink"
      />
      {children}
    </span>
    {aside}
  </label>
);
