/** Placeholder with the cart page's layout while the cart loads. */
export const CartSkeleton = () => (
  <div className="shop-page" aria-busy="true">
    <output className="sr-only">Pilzkorb wird geladen…</output>
    <div className="cartpage-head" aria-hidden="true">
      <div className="skeleton skeleton--title" />
    </div>
    <div className="shop-split" aria-hidden="true">
      <ul className="cartpage-list">
        {[0, 1].map((i) => (
          <li key={i} className="cartpage-item">
            <div className="cartpage-thumb cartpage-thumb--empty skeleton" />
            <div className="cartpage-body">
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line skeleton--short" />
              <div className="skeleton skeleton--stepper" />
            </div>
          </li>
        ))}
      </ul>
      <div className="shop-side shop-side--cart">
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--button" />
      </div>
    </div>
  </div>
);
