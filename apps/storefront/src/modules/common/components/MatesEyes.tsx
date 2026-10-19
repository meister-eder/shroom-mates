import { gazePoint, onGaze } from "@shroom-mates/ui/gaze";
import { useEffect, useRef, useState } from "react";

/**
 * Maskottchen mit Augen, die dem Mauszeiger folgen (und ab und zu blinzeln);
 * auf dem Handy schauen sie auf den letzten Tipp, folgen der Neigung oder dem
 * Scrollen (siehe @shroom-mates/ui/gaze).
 * Das Bild liegt als /mascot.webp vor, die vier Augen sind eine SVG-Ebene im
 * 1200er-Raster darüber (Geometrie aus dem Design-Mockup). Ohne Zeiger oder bei
 * prefers-reduced-motion: Ruheblick (leicht nach unten), kein Blinzeln.
 */
const EYES: [number, number, number, number][] = [
  [414, 462, 27, 45],
  [478, 465, 27, 44],
  [780, 597, 31, 53],
  [852, 594, 32, 53],
];

interface Props {
  size?: number;
  alt?: string;
  className?: string;
}

export const MatesEyes = ({ size = 340, alt = "", className }: Props) => {
  const box = useRef<HTMLDivElement>(null);
  // Ruhestellung wie im Mockup: Blick leicht nach unten (600/900 im 1200er-Raster).
  const [look, setLook] = useState<{ x: number; y: number }>({
    x: 600,
    y: 900,
  });
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const unsubscribe = onGaze((gaze) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = box.current?.getBoundingClientRect();
        if (!r) return;
        const p = gazePoint(
          gaze,
          r.left + r.width / 2,
          r.top + r.height / 2,
          Math.max(200, r.width),
        );
        if (!p) return setLook({ x: 600, y: 900 });
        const k = 1200 / r.width;
        setLook({ x: (p.x - r.left) * k, y: (p.y - r.top) * k });
      });
    });
    let t: number;
    const iv = window.setInterval(() => {
      setBlink(true);
      t = window.setTimeout(() => setBlink(false), 140);
    }, 3800);
    return () => {
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
      clearInterval(iv);
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      ref={box}
      className={className}
      style={{
        position: "relative",
        width: size,
        maxWidth: "100%",
        aspectRatio: "1 / 1",
      }}
    >
      <img
        src="/mascot.webp"
        alt={alt}
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 1200"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {EYES.map(([cx, cy, rx, ry]) => {
          const prx = rx * 0.6;
          const pry = ry * 0.6;
          const tx = look.x;
          const ty = look.y;
          const dx = tx - cx;
          const dy = ty - cy;
          const d = Math.hypot(dx, dy) || 1;
          const reach = Math.min(1, d / 220);
          const px = cx + (dx / d) * (rx - prx - 4) * reach;
          const py = cy + (dy / d) * (ry - pry - 4) * reach;
          const by = blink ? 0.08 : 1;
          return (
            <g key={`${cx}-${cy}`}>
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry * by}
                fill="#fffdf5"
                stroke="#ff4908"
                strokeWidth={7}
              />
              {!blink && (
                <ellipse cx={px} cy={py} rx={prx} ry={pry} fill="#ff4908" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
