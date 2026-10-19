import type { ReactNode } from "react";

export type StepState = "active" | "done" | "inactive";

interface CheckoutStepProps {
  number: number;
  title: string;
  state: StepState;
  onEdit?: () => void;
  children?: ReactNode;
}

/** ComicPanel shell shared by the checkout steps (address, delivery, payment, review). */
export const CheckoutStep = ({
  number,
  title,
  state,
  onEdit,
  children,
}: CheckoutStepProps) => (
  <section className={`cstep cstep--${state}`}>
    <div className="cstep-head">
      <h2 className="cstep-title">
        <span className="cstep-num" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
        {title}
      </h2>
      {state === "done" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ändern: ${title}`}
          className="cstep-edit"
        >
          Ändern
        </button>
      )}
    </div>
    {state === "active" && children && (
      <div className="cstep-body">{children}</div>
    )}
    {state === "done" && children && (
      <div className="cstep-summary">{children}</div>
    )}
  </section>
);
