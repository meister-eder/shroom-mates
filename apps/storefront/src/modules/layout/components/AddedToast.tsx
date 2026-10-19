import { openCartSidebar } from "@lib/stores/cart";
import { $toast, hideToast } from "@lib/stores/toast";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";

/** "Liegt im Körbchen ✓" toast with the mascot. Mounted once in the layout. */
export const AddedToast = () => {
  const toast = useStore($toast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className={`toast${toast.kind === "error" ? " toast--error" : ""}`} key={toast.id}>
          <MatesEyes size={56} className="toast__mascot" />
          <p className="toast__text">
            {toast.kind === "added" ? (
              <>
                <strong>
                  <span className="toast__name">{toast.title} </span>liegt im Körbchen!
                </strong>
              </>
            ) : (
              <>
                <strong>Das hat nicht geklappt.</strong>
                <span>{toast.title}</span>
              </>
            )}
          </p>
          {toast.kind === "added" && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                hideToast();
                openCartSidebar();
              }}
            >
              Ansehen
            </button>
          )}
        </div>
      )}
    </div>
  );
};
