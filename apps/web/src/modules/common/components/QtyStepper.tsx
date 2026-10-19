import { Icon } from "./Icon";

interface QtyStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Accessible name of the group, e.g. "Anzahl Lion's Mane Growkit" */
  label?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
  disabled?: boolean;
  disableDecrease?: boolean;
  disableIncrease?: boolean;
  size?: "sm" | "md" | "lg";
}

/** Pill stepper "− 1 +" (>= 44px touch targets). */
export const QtyStepper = ({
  value,
  onDecrease,
  onIncrease,
  label = "Anzahl",
  decreaseLabel = "Menge verringern",
  increaseLabel = "Menge erhöhen",
  disabled = false,
  disableDecrease = false,
  disableIncrease = false,
  size = "md",
}: QtyStepperProps) => (
  // biome-ignore lint/a11y/useSemanticElements: ARIA-Rolle bewusst gesetzt, natives Element würde Darstellung und Verhalten ändern
  <div
    role="group"
    aria-label={label}
    className={`qty-stepper qty-stepper--${size}`}
  >
    <button
      type="button"
      onClick={onDecrease}
      disabled={disabled || disableDecrease}
      aria-label={decreaseLabel}
    >
      <Icon name="minus" size={size === "lg" ? 22 : 18} />
    </button>
    <span aria-live="polite" aria-atomic="true">
      <span className="sr-only">Menge: </span>
      {value}
    </span>
    <button
      type="button"
      onClick={onIncrease}
      disabled={disabled || disableIncrease}
      aria-label={increaseLabel}
    >
      <Icon name="plus" size={size === "lg" ? 22 : 18} />
    </button>
  </div>
);
