/**
 * Little mushroom that flies in an arc from an "add to cart" button into the
 * Pilzkorb in the header, which then bounces. Purely decorative: skipped with
 * reduced motion or when the browser lacks the Web Animations API.
 */

const SHROOM_SVG = `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
  <path d="M19 26c-1 6-2 11-1 14 1 3 11 3 12 0 1-3 0-8-1-14Z" fill="#fffdf5" stroke="#1c1a33" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M5 25C5 13 14 6 24 6s19 7 19 19c0 2-3 3-19 3S5 27 5 25Z" fill="#ff4908" stroke="#1c1a33" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="15" cy="17" r="3" fill="#fffdf5"/><circle cx="27" cy="12" r="2.4" fill="#fffdf5"/><circle cx="33" cy="20" r="3.2" fill="#fffdf5"/>
  <circle cx="21" cy="34" r="1.6" fill="#1c1a33"/><circle cx="27" cy="34" r="1.6" fill="#1c1a33"/>
</svg>`;

export function flyToCart(from: Element | null | undefined): void {
  if (!from || typeof document === "undefined") return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = [...document.querySelectorAll<HTMLElement>(".cart-pill")].find(
    (el) => el.offsetParent !== null,
  );
  const a = from.getBoundingClientRect();
  const size = 48;
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  let x1 = innerWidth - 56 - size / 2;
  let y1 = -size;
  if (target) {
    const b = target.getBoundingClientRect();
    x1 = b.left + b.width / 2 - size / 2;
    // header scrolled away: aim at its spot just above the viewport
    y1 = Math.max(-size, b.top + b.height / 2 - size / 2);
  }

  const el = document.createElement("div");
  el.className = "fly-shroom";
  el.innerHTML = SHROOM_SVG;
  Object.assign(el.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${size}px`,
    height: `${size}px`,
    zIndex: "200",
    pointerEvents: "none",
    willChange: "transform",
  });
  document.body.append(el);
  if (typeof el.animate !== "function") {
    el.remove();
    return;
  }

  // quadratic bezier with the control point well above both ends
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - Math.max(120, Math.abs(x1 - x0) * 0.35);
  const steps = 16;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const scale = 1 + Math.sin(t * Math.PI) * 0.35 - t * 0.55;
    const rot = t * 540;
    frames.push({
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(0)}deg) scale(${scale.toFixed(2)})`,
      opacity: t > 0.92 ? 0 : 1,
    });
  }
  const flight = el.animate(frames, { duration: 820, easing: "cubic-bezier(.45,0,.55,1)" });
  flight.onfinish = flight.oncancel = () => {
    el.remove();
    target?.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18) rotate(-4deg)" },
        { transform: "scale(0.96) rotate(2deg)" },
        { transform: "scale(1)" },
      ],
      { duration: 380, easing: "ease-out" },
    );
  };
}
