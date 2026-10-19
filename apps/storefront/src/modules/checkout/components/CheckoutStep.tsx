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
  inactive: "bg-[#f4f4ff] opacity-60",
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
    className={`overflow-hidden rounded-none border-2 border-accent ${SHELL[state]}`}
  >
    <div
      className={`flex items-center justify-between gap-4 px-[22px] py-[18px] ${HEAD[state]}`}
    >
      <h2 className="m-0 flex items-center gap-3 font-display text-[26px]! leading-none! font-black">
        <span className="font-mono text-sm font-medium" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
        {title}
      </h2>
      {state === "done" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ändern: ${title}`}
          className="min-h-11 cursor-pointer border-0 bg-transparent px-1 font-body text-base text-ink underline hover:text-accent-dark"
        >
          Ändern
        </button>
      )}
    </div>
    {state === "active" && children && (
      <div className="p-[22px]">{children}</div>
    )}
    {state === "done" && children && (
      <div className="px-[22px] pb-[18px] pt-3.5 text-base">{children}</div>
    )}
  </section>
);
