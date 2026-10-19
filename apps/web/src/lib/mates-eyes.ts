import { gazePoint, onGaze } from "@shroom-mates/ui/gaze";

/**
 * Vanilla twin of modules/common/components/MatesEyes.tsx: mascot with eyes
 * that follow the gaze (see @shroom-mates/ui/gaze) and blink now and then.
 * Returns the element and a cleanup function.
 */
const EYES: [number, number, number, number][] = [
  [414, 462, 27, 45],
  [478, 465, 27, 44],
  [780, 597, 31, 53],
  [852, 594, 32, 53],
];
const NS = "http://www.w3.org/2000/svg";

export function createMatesEyes(
  size: number,
  className?: string,
): { el: HTMLElement; destroy: () => void } {
  const box = document.createElement("div");
  if (className) box.className = className;
  Object.assign(box.style, {
    position: "relative",
    width: `${size}px`,
    maxWidth: "100%",
    aspectRatio: "1 / 1",
  });
  const img = document.createElement("img");
  img.src = "/mascot.webp";
  img.alt = "";
  img.width = size;
  img.height = size;
  Object.assign(img.style, {
    position: "absolute",
    inset: "0",
    display: "block",
    width: "100%",
    height: "100%",
  });
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 1200 1200");
  Object.assign(svg.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
  });
  const parts = EYES.map(([cx, cy, rx, ry]) => {
    const white = document.createElementNS(NS, "ellipse");
    white.setAttribute("cx", String(cx));
    white.setAttribute("cy", String(cy));
    white.setAttribute("rx", String(rx));
    white.setAttribute("fill", "#fffdf5");
    white.setAttribute("stroke", "#ff4908");
    white.setAttribute("stroke-width", "7");
    const pupil = document.createElementNS(NS, "ellipse");
    pupil.setAttribute("rx", String(rx * 0.6));
    pupil.setAttribute("ry", String(ry * 0.6));
    pupil.setAttribute("fill", "#ff4908");
    svg.append(white, pupil);
    return { cx, cy, rx, ry, white, pupil };
  });
  box.append(img, svg);

  let look = { x: 600, y: 900 };
  let blink = false;
  const render = () => {
    for (const { cx, cy, rx, ry, white, pupil } of parts) {
      const prx = rx * 0.6;
      const pry = ry * 0.6;
      const dx = look.x - cx;
      const dy = look.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 220);
      white.setAttribute("ry", String(ry * (blink ? 0.08 : 1)));
      pupil.setAttribute("cx", String(cx + (dx / d) * (rx - prx - 4) * reach));
      pupil.setAttribute("cy", String(cy + (dy / d) * (ry - pry - 4) * reach));
      pupil.style.display = blink ? "none" : "";
    }
  };
  render();

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { el: box, destroy() {} };
  }
  let frame = 0;
  const unsubscribe = onGaze((gaze) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = box.getBoundingClientRect();
      const p = gazePoint(
        gaze,
        r.left + r.width / 2,
        r.top + r.height / 2,
        Math.max(200, r.width),
      );
      if (!p) look = { x: 600, y: 900 };
      else {
        const k = 1200 / r.width;
        look = { x: (p.x - r.left) * k, y: (p.y - r.top) * k };
      }
      render();
    });
  });
  let t = 0;
  const iv = window.setInterval(() => {
    blink = true;
    render();
    t = window.setTimeout(() => {
      blink = false;
      render();
    }, 140);
  }, 3800);
  return {
    el: box,
    destroy() {
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
      clearInterval(iv);
      clearTimeout(t);
    },
  };
}
