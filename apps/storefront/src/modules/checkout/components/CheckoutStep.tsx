import type { ReactNode } from "react";

export type StepState = "active" | "done" | "inactive";

interface CheckoutStepProps {
  number: number;
  title: string;
  state: StepState;
  onEdit?: () => void;
  children?: ReactNode;
}

const SHELL: Record<StepState, string> = {
  active: "bg-white shadow-card",
  done: "bg-white",
  inactive: "bg-paper opacity-60",
};

const HEAD: Record<StepState, string> = {
  active: "bg-lavender border-b-[3px] border-ink",
  done: "bg-cream border-b-2 border-ink",
  inactive: "bg-cream",
};

/** ComicPanel shell shared by the checkout steps (address, delivery, payment, review). */
export const CheckoutStep = ({
  number,
  title,
  state,
  onEdit,
  children,
}: CheckoutStepProps) => (
  <section
    className={`overflow-hidden rounded-[26px] border-[3px] border-ink ${SHELL[state]}`}
  >
    <div
      className={`flex items-center justify-between gap-4 px-[22px] py-[18px] ${HEAD[state]}`}
    >
      <h2 className="m-0 flex items-center gap-3 font-display text-[26px]! leading-none! font-black">
        <span className="comic-panel__num text-sm" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
        {title}
      </h2>
      {state === "done" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ändern: ${title}`}
          className="min-h-11 cursor-pointer border-0 bg-transparent px-1 font-body text-base font-semibold underline hover:text-accent-dark"
        >
          Ändern
        </button>
      )}
    </div>
    {state !== "inactive" && children && (
      <div className="px-[22px] py-[22px]">{children}</div>
    )}
  </section>
);
