import type { ReactNode } from "react";

export type StepState = "active" | "done" | "inactive";

interface CheckoutStepProps {
  number: number;
  title: string;
  state: StepState;
  onEdit?: () => void;
  children?: ReactNode;
}

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Card shell shared by the address, delivery and payment steps. */
export const CheckoutStep = ({
  number,
  title,
  state,
  onEdit,
  children,
}: CheckoutStepProps) => (
  <section className={`checkout-step${state === "inactive" ? " inactive" : ""}`}>
    <div className="checkout-step-header">
      <div
        className={`checkout-step-number${state === "inactive" ? "" : ` ${state}`}`}
      >
        {state === "done" ? <CheckIcon /> : number}
      </div>
      <h2 className="checkout-step-title">{title}</h2>
      {state === "done" && onEdit && (
        <button type="button" onClick={onEdit} className="checkout-edit-btn">
          Bearbeiten
        </button>
      )}
    </div>
    {state !== "inactive" && children && (
      <div className="checkout-step-body">{children}</div>
    )}
  </section>
);
