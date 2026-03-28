import {
  $cartItemCount,
  $regionId,
  initCart,
  toggleCartSidebar,
} from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";

interface NavProps {
  countryCode: string;
  regionId: string | null;
}

export const Nav = ({ countryCode, regionId }: NavProps) => {
  const cartItemCount = useStore($cartItemCount);

  useEffect(() => {
    if (regionId) {
      $regionId.set(regionId);
      initCart();
    }
  }, [regionId]);

  const handleCartClick = () => {
    toggleCartSidebar();
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        background: "var(--bg-accent, #fdfcea)",
        borderBottom: "2px solid #000",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Left: Website link */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <a
            href="https://shroom-mates.de"
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.9rem",
              color: "var(--text-color, #1d1d1d)",
              textDecoration: "none",
            }}
          >
            ← Website
          </a>
          <a
            href={`/${countryCode}/store`}
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.9rem",
              color: "var(--text-color, #1d1d1d)",
              textDecoration: "none",
            }}
          >
            Produkte
          </a>
        </div>

        {/* Center: Logo */}
        <a
          href={`/${countryCode}`}
          style={{
            color: "var(--accent, #ff4908)",
            fontWeight: "bold",
            fontSize: "1.3rem",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          shroom-mates
        </a>

        {/* Right: Cart */}
        <button
          onClick={handleCartClick}
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.9rem",
            background: "none",
            border: cartItemCount > 0 ? "2px solid var(--accent, #ff4908)" : "2px solid #000",
            borderRadius: "6px",
            padding: "0.4rem 1rem",
            cursor: "pointer",
            color: "var(--text-color, #1d1d1d)",
            transition: "all 0.2s ease",
          }}
          aria-label={`Warenkorb mit ${cartItemCount} ${cartItemCount === 1 ? "Artikel" : "Artikeln"}`}
        >
          <span aria-live="polite" aria-atomic="true">
            🛒 Warenkorb ({cartItemCount})
          </span>
        </button>
      </nav>
    </header>
  );
};
