import { KIND_GLOW, KIND_HYPHA, KIND_STRAND, type Network } from "./grow";

/** rgb of the periwinkle glow (#9fa2f7), a deeper haze and the cream-white filament */
const GLOW = "159,162,247";
const HAZE = "120,124,236";
const CORE = "255,254,250";

const buckets = new Map<number, number[]>();

/**
 * Strokes entries idx[from..to) of `net` into ctx (already transformed to the
 * tile's coordinate space). Entries are batched by kind and quantised
 * width/alpha, so a call costs a few dozen strokes, not one per segment.
 *
 * Order: cord glow band, hyphae (faint periwinkle halo, then cream core),
 * cord strands on top.
 */
export function drawEntries(
  ctx: CanvasRenderingContext2D,
  net: Network,
  idx: Int32Array,
  from: number,
  to: number,
  dpr = 1,
) {
  if (to <= from) return;
  // hairlines need a little more weight on low-density screens to stay visible
  const minW = dpr >= 1.5 ? 0.8 : 1.1;
  const halo = dpr >= 1.5 ? 1 : 1.25;
  buckets.clear();
  for (let i = from; i < to; i++) {
    const e = idx[i]!;
    const wq = Math.min(511, Math.round(net.width[e]! / 0.1));
    const aq = Math.min(7, Math.round(net.alpha[e]! * 7));
    const b = (net.kind[e]! << 12) | (wq << 3) | aq;
    let list = buckets.get(b);
    if (!list) buckets.set(b, (list = []));
    list.push(e);
  }
  const pos = net.pos;
  const path = (list: number[]) => {
    ctx.beginPath();
    for (const e of list) {
      ctx.moveTo(pos[e * 4]!, pos[e * 4 + 1]!);
      ctx.lineTo(pos[e * 4 + 2]!, pos[e * 4 + 3]!);
    }
  };
  const pass = (kind: number, fn: (w: number, a: number) => void) => {
    for (const [b, list] of buckets) {
      if (b >> 12 !== kind) continue;
      path(list);
      fn(((b >> 3) & 511) * 0.1, (b & 7) / 7);
    }
  };

  // glow band: many short, round-capped, very transparent strokes overlap
  // into a soft band that is strongest along the centre
  ctx.lineCap = "round";
  pass(KIND_GLOW, (w) => {
    ctx.strokeStyle = `rgba(${GLOW},0.055)`;
    ctx.lineWidth = w;
    ctx.stroke();
  });

  // butt caps from here on: consecutive translucent segments must not overlap,
  // or they bead up at every joint
  ctx.lineCap = "butt";
  pass(KIND_HYPHA, (w, a) => {
    ctx.strokeStyle = `rgba(${HAZE},${(0.06 + 0.12 * Math.min(1, w / 1.6)) * a * halo})`;
    ctx.lineWidth = 2.4 + w * 2.6;
    ctx.stroke();
  });
  pass(KIND_HYPHA, (w, a) => {
    ctx.strokeStyle = `rgba(${CORE},${(0.62 + 0.3 * Math.min(1, w / 1.6)) * (0.6 + 0.4 * a)})`;
    ctx.lineWidth = Math.max(minW, w);
    ctx.stroke();
  });
  pass(KIND_STRAND, (w) => {
    ctx.strokeStyle = `rgba(${HAZE},${0.13 * halo})`;
    ctx.lineWidth = w * 2 + 3;
    ctx.stroke();
  });
  pass(KIND_STRAND, (w) => {
    ctx.strokeStyle = `rgba(${CORE},0.93)`;
    ctx.lineWidth = Math.max(minW, w);
    ctx.stroke();
  });
}

/** sorted-keys binary search: first index with keys[i] > v */
export function upperBound(keys: Float32Array, v: number) {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (keys[m]! <= v) lo = m + 1;
    else hi = m;
  }
  return lo;
}

/**
 * Highlights the growing tips: entries revealed within the last `fade` px of
 * the front whose successor is not revealed yet get a small bright bead with a
 * soft glow. ctx must map page (main) coordinates; y0..y1 is the visible range.
 */
export function drawTips(ctx: CanvasRenderingContext2D, net: Network, front: number, y0: number, y1: number, fade = 160) {
  const end = upperBound(net.key, front);
  const start = upperBound(net.key, front - fade);
  const { pos, kind, next, key, width } = net;
  // only tips that are still growing: their next segment exists but is not revealed
  const beads: number[] = [];
  for (let e = start; e < end; e++) {
    const k = kind[e];
    if (k === KIND_GLOW || next[e]! <= front || next[e] === Infinity) continue;
    const y = pos[e * 4 + 3]!;
    if (y < y0 || y > y1) continue;
    beads.push(e);
  }
  // soft white glow, then a bright core, batched by fade level
  for (let level = 1; level <= 4; level++) {
    const lo = (level - 1) / 4;
    const hi = level / 4;
    const glow = new Path2D();
    const core = new Path2D();
    let any = false;
    for (const e of beads) {
      const f = 1 - (front - key[e]!) / fade;
      if (f <= lo || f > hi) continue;
      any = true;
      const x = pos[e * 4 + 2]!;
      const y = pos[e * 4 + 3]!;
      const big = kind[e] === KIND_STRAND;
      const rg = big ? 7 : 3.2;
      const rc = big ? 0.9 + width[e]! * 0.5 : 1.05;
      glow.moveTo(x + rg, y);
      glow.arc(x, y, rg, 0, Math.PI * 2);
      core.moveTo(x + rc, y);
      core.arc(x, y, rc, 0, Math.PI * 2);
    }
    if (!any) continue;
    ctx.fillStyle = `rgba(${CORE},${0.22 * hi})`;
    ctx.fill(glow);
    ctx.fillStyle = `rgba(${CORE},${0.4 + 0.6 * hi})`;
    ctx.fill(core);
  }
}
