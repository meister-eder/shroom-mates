/**
 * Deterministic mycelium growth simulation (no DOM, runs in the browser and in
 * bun/node for previews).
 *
 * Two parts:
 *
 * 1. A main cord (rhizomorph) snaking down the page through the gutters,
 *    after the designer's prototype "Myzel-Faden": a bundle of parallel,
 *    slightly diverging, wobbly white strands over a wide soft lavender glow.
 *
 * 2. A hyphal network (agent-based apical growth, loosely after Moore's
 *    "neighbour-sensing" models), sprouting mostly from the cord and a bit
 *    from the page edges:
 *    - hyphae grow only at the tip, a fixed step per tick, with a smooth
 *      random walk and negative autotropism (tips steer away from dense
 *      mycelium) and grow away from where they started
 *    - sub-apical branching a few steps behind the tip at ~35–70°,
 *      alternating sides; most laterals are short-lived (fuzz), some explore
 *    - anastomosis: a tip running into a foreign hypha fuses and stops
 *    - growth is held behind a front that moves down the page, so it can be
 *      tied to the scroll position
 *    - pipe model: a segment's width grows with the length of mycelium it
 *      feeds, so old strands thicken while young tips stay hair-fine
 *
 * Output: flat draw entries sorted by `key`, the y of the growth front at
 * which the entry becomes visible.
 */

export const KIND_HYPHA = 0;
export const KIND_STRAND = 1;
export const KIND_GLOW = 2;

export type Network = {
  W: number;
  H: number;
  count: number;
  /** x1, y1, x2, y2 per entry */
  pos: Float32Array;
  /** line width (CSS px) */
  width: Float32Array;
  /** opacity multiplier 0..1 */
  alpha: Float32Array;
  /** reveal key: entry is visible once the front has reached this y */
  key: Float32Array;
  /** KIND_* */
  kind: Uint8Array;
  /** key of the next segment of the same filament (Infinity at a dead end); a
   *  revealed entry whose successor is not revealed yet is a growing tip */
  next: Float32Array;
};

export type GrowOptions = {
  seed?: number;
  /** fewer tips / narrower cord for small screens */
  compact?: boolean;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tip = {
  h: number; // hypha id
  ox: number; // where the hypha started (tips grow away from it)
  oy: number;
  x: number;
  y: number;
  a: number; // heading
  c: number; // persistent curvature
  life: number; // remaining steps
  age: number;
  side: number; // next branch side
  gap: number; // steps until next branch is allowed
};

type Hypha = {
  parent: number;
  /** index (in parent's segment list) where this hypha branched off */
  at: number;
  segs: number[]; // raw segment ids
  children: number[];
};

type Origin = {
  x: number;
  y: number;
  dir: number;
  spread: number;
  n: number;
  life: number;
  lead: number;
};

type Entry = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
  a: number;
  k: number;
  kind: number;
  next: number;
};

/** centre line of the main cord, sampled every ~3px */
function cordLine(W: number, H: number, compact: boolean, rnd: () => number) {
  // waypoints zig-zag between the gutters, down the whole page
  const pts: [number, number][] = [];
  const spacing = compact ? 620 : 820;
  const lo = compact ? [0.1, 0.3] : [0.05, 0.2];
  const hi = compact ? [0.7, 0.9] : [0.8, 0.95];
  pts.push([W * (compact ? 0.66 : 0.58), -60]);
  pts.push([W * (compact ? 0.6 : 0.5), 60]);
  let right = rnd() < 0.5;
  for (
    let y = spacing * 0.75;
    y < H + spacing;
    y += spacing * (0.85 + rnd() * 0.3)
  ) {
    const [a, b] = right ? hi : lo;
    pts.push([W * (a! + rnd() * (b! - a!)), y]);
    right = !right;
  }
  // Catmull-Rom through the waypoints, resampled by arc length
  const dense: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    for (let s = 0; s < 1; s += 1 / 160) {
      const s2 = s * s;
      const s3 = s2 * s;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + c) * s +
          (2 * a - 5 * b + 4 * c - d) * s2 +
          (-a + 3 * b - 3 * c + d) * s3);
      dense.push([
        f(p0[0], p1[0], p2[0], p3[0]),
        f(p0[1], p1[1], p2[1], p3[1]),
      ]);
    }
  }
  const out: { x: number; y: number; nx: number; ny: number; s: number }[] = [];
  let acc = 0;
  let last = dense[0]!;
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  for (let i = 1; i < dense.length; i++) {
    const p = dense[i]!;
    acc += Math.hypot(p[0] - last[0], p[1] - last[1]);
    last = p;
    if (out.length && acc - out[out.length - 1]!.s < 3) continue;
    const q = dense[Math.max(0, i - 1)]!;
    const tx = p[0] - q[0];
    const ty = p[1] - q[1];
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    // organic wobble, like the prototype's displacement map
    const wob =
      11 * Math.sin(acc / 120 + ph[0]!) +
      5 * Math.sin(acc / 47 + ph[1]!) +
      2 * Math.sin(acc / 17 + ph[2]!);
    out.push({ x: p[0] + nx * wob, y: p[1] + ny * wob, nx, ny, s: acc });
    if (p[1] > H + 40) break;
  }
  return out;
}

export function grow(W: number, H: number, opts: GrowOptions = {}): Network {
  const seed = opts.seed ?? 20260519;
  const compact = opts.compact ?? W < 760;
  const rnd = mulberry32(seed);
  // separate streams, so a taller page only appends at the bottom instead of
  // reshuffling the whole network
  const rndEdge = mulberry32(seed ^ 0x9e3779b9);
  const rndSpot = mulberry32(seed ^ 0x85ebca6b);
  const rndCord = mulberry32(seed ^ 0xc2b2ae35);

  const STEP = compact ? 3.4 : 3.0;
  const FRONT_V = compact ? 2.6 : 2.2; // px the growth front advances per tick
  const FRONT_SLACK = compact ? 300 : 380; // how far tips may run ahead of the front
  const MAX_TIPS = compact ? 420 : 1200;
  const MAX_SEGS = compact ? 80000 : 240000;
  const CELL = 8;
  const keyOfTick = (t: number) => t * FRONT_V + FRONT_SLACK;

  const gw = Math.ceil(W / CELL) + 1;
  const gh = Math.ceil(H / CELL) + 1;
  const dens = new Uint8Array(gw * gh);
  const owner = new Int32Array(gw * gh).fill(-1);
  const cellOf = (x: number, y: number) => {
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx >= gw || cy >= gh) return -1;
    return cy * gw + cx;
  };

  // ---- main cord -----------------------------------------------------------
  const cord = cordLine(W, H, compact, rndCord);

  // proximity to the cord (coarse field): mycelium is densest around it
  const FC = 24;
  const fw = Math.ceil(W / FC) + 1;
  const fh = Math.ceil(H / FC) + 1;
  const field = new Float32Array(fw * fh);
  const R = compact ? 110 : 170;
  for (let i = 0; i < cord.length; i += 4) {
    const p = cord[i]!;
    const cx0 = Math.max(0, Math.floor((p.x - R) / FC));
    const cx1 = Math.min(fw - 1, Math.floor((p.x + R) / FC));
    const cy0 = Math.max(0, Math.floor((p.y - R) / FC));
    const cy1 = Math.min(fh - 1, Math.floor((p.y + R) / FC));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const d = Math.hypot(cx * FC + FC / 2 - p.x, cy * FC + FC / 2 - p.y);
        const v = 1 - d / R;
        if (v > field[cy * fw + cx]!) field[cy * fw + cx] = v;
      }
    }
  }
  const near = (x: number, y: number) => {
    const cx = Math.floor(x / FC);
    const cy = Math.floor(y / FC);
    if (cx < 0 || cy < 0 || cx >= fw || cy >= fh) return 0;
    return field[cy * fw + cx]!;
  };

  // 1 in the page gutters and around the cord, lower over the text column
  const half = W / 2;
  const content = Math.min(W, 1180) / 2;
  const weight = (x: number, y: number) => {
    const d = Math.abs(x - half);
    let g: number;
    if (compact) g = 0.5 + 0.5 * Math.min(1, d / half) ** 2;
    else {
      const t = Math.min(
        1,
        Math.max(0, (d - content * 0.35) / (content * 0.75)),
      );
      g = 0.4 + 0.6 * t * t * (3 - 2 * t);
    }
    return Math.max(g, Math.min(1, near(x, y) * 1.6));
  };

  // ---- hyphal network --------------------------------------------------------
  const sx1: number[] = [];
  const sy1: number[] = [];
  const sx2: number[] = [];
  const sy2: number[] = [];
  const sTick: number[] = [];
  const hyphae: Hypha[] = [];
  const tips: Tip[] = [];

  const newHypha = (parent: number, at: number) => {
    hyphae.push({ parent, at, segs: [], children: [] });
    const id = hyphae.length - 1;
    if (parent >= 0) hyphae[parent]!.children.push(id);
    return id;
  };

  const origins: Origin[] = [];
  // sprouts all along the cord, alternating sides
  {
    const every = compact ? 7 : 5; // cord samples (~3px each)
    let side = 1;
    for (
      let i = 4;
      i < cord.length;
      i += every + Math.floor(rndCord() * every)
    ) {
      const p = cord[i]!;
      side = rndCord() < 0.75 ? -side : side;
      const dir =
        Math.atan2(p.ny * side, p.nx * side) + (rndCord() - 0.5) * 1.1;
      origins.push({
        x: p.x,
        y: p.y,
        dir,
        spread: 0,
        n: 1,
        life: 25 + rndCord() * (compact ? 120 : 170),
        lead: 1,
      });
    }
  }
  // hero: a little from both upper corners
  origins.push({
    x: -4,
    y: 60,
    dir: 0.5,
    spread: 1.1,
    n: compact ? 4 : 7,
    life: 200,
    lead: 0.6,
  });
  origins.push({
    x: W + 4,
    y: 140,
    dir: Math.PI - 0.5,
    spread: 1.1,
    n: compact ? 4 : 7,
    life: 200,
    lead: 0.6,
  });
  // then along both edges, staggered down the page
  for (
    let y = 700, i = 0;
    y < H - 200;
    y += (compact ? 760 : 900) * (0.8 + rndEdge() * 0.4), i++
  ) {
    const left = i % 2 === 1;
    origins.push({
      x: left ? -4 : W + 4,
      y,
      dir: left
        ? 0.15 + (rndEdge() - 0.5) * 0.4
        : Math.PI - 0.15 + (rndEdge() - 0.5) * 0.4,
      spread: 1.45,
      n: compact ? 5 : 8,
      life: compact ? 130 : 180,
      lead: 0.6,
    });
  }
  // inoculation points (spawn grains) in the gutters: small star colonies
  for (
    let y = 400 + rndSpot() * 200;
    y < H - 150;
    y += (compact ? 900 : 650) * (0.7 + rndSpot() * 0.6)
  ) {
    const left = rndSpot() < 0.5;
    const x = compact
      ? (left ? 0.04 : 0.96) * W
      : (left ? 0.015 + rndSpot() * 0.1 : 0.885 + rndSpot() * 0.1) * W;
    origins.push({
      x,
      y,
      dir: rndSpot() * 6.28,
      spread: Math.PI,
      n: compact ? 5 : 8,
      life: compact ? 60 : 85,
      lead: 0.6,
    });
  }
  // an origin starts when the front has (nearly) reached it
  const startTick = (o: Origin) =>
    Math.max(0, (o.y - FRONT_SLACK * o.lead) / FRONT_V);
  origins.sort((a, b) => startTick(a) - startTick(b));
  let nextOrigin = 0;

  const spawn = (
    h: number,
    x: number,
    y: number,
    a: number,
    life: number,
    ox: number,
    oy: number,
  ) => {
    tips.push({
      h,
      ox,
      oy,
      x,
      y,
      a,
      c: (rnd() - 0.5) * 0.02,
      life,
      age: 0,
      side: rnd() < 0.5 ? 1 : -1,
      gap: 3 + rnd() * 6,
    });
  };

  const branchLife = () => {
    const r = rnd();
    if (r < 0.58) return 3 + rnd() * 16; // fuzz
    if (r < 0.9) return 25 + rnd() * 110; // laterals
    return 110 + rnd() * 220; // explorers
  };

  const sense = (x: number, y: number) => {
    const c = cellOf(x, y);
    return c < 0 ? 4 : dens[c]!;
  };

  let tick = 0;
  const lastTick = (H + FRONT_SLACK) / FRONT_V + 400;
  while (
    (tips.length || nextOrigin < origins.length) &&
    sx1.length < MAX_SEGS &&
    tick < lastTick
  ) {
    while (
      nextOrigin < origins.length &&
      startTick(origins[nextOrigin]!) <= tick
    ) {
      const o = origins[nextOrigin++]!;
      for (let k = 0; k < o.n; k++) {
        const h = newHypha(-1, 0);
        const a =
          o.dir +
          (o.n > 1 ? (k / (o.n - 1) - 0.5) * o.spread * 2 : 0) +
          (rnd() - 0.5) * 0.3;
        const jitter = o.n > 1 ? 1 : 0;
        spawn(
          h,
          o.x + (rnd() - 0.5) * 10 * jitter,
          o.y + (rnd() - 0.5) * 30 * jitter,
          a,
          o.life * (0.6 + rnd() * 0.8),
          o.x,
          o.y,
        );
      }
    }
    const front = tick * FRONT_V + FRONT_SLACK;

    for (let i = tips.length - 1; i >= 0; i--) {
      const t = tips[i]!;
      // the front holds tips back so growth sweeps down the page
      // (with a ragged edge, so the frontier doesn't read as a ruler line)
      const edge =
        front + 46 * Math.sin(t.x / 110 + 1.3) + 26 * Math.sin(t.x / 41);
      if (t.y > edge && Math.sin(t.a) > -0.2) continue;
      t.age++;
      t.life--;

      // negative autotropism: steer away from the denser side
      const look = CELL * 2.2;
      const dl = sense(
        t.x + Math.cos(t.a - 0.55) * look,
        t.y + Math.sin(t.a - 0.55) * look,
      );
      const dr = sense(
        t.x + Math.cos(t.a + 0.55) * look,
        t.y + Math.sin(t.a + 0.55) * look,
      );
      t.c += (rnd() - 0.5) * 0.016;
      t.c *= 0.9;
      // apical dominance: tips keep growing away from where they started
      const out = Math.atan2(t.y - t.oy, t.x - t.ox);
      const off =
        t.age > 3 ? Math.atan2(Math.sin(out - t.a), Math.cos(out - t.a)) : 0;
      t.a +=
        t.c +
        (rnd() - 0.5) * 0.2 +
        off * 0.015 +
        (dl > dr ? 0.05 : dr > dl ? -0.05 : 0);

      const step = STEP * (0.85 + rnd() * 0.3);
      const nx = t.x + Math.cos(t.a) * step;
      const ny = t.y + Math.sin(t.a) * step;

      if (nx < -30 || nx > W + 30 || ny < -30 || ny > H + 10) {
        tips.splice(i, 1);
        continue;
      }

      const c = cellOf(nx, ny);
      const hy = hyphae[t.h]!;
      // anastomosis: meeting a foreign hypha
      let fused = false;
      if (c >= 0 && owner[c]! >= 0 && owner[c] !== t.h && t.age > 6) {
        const other = owner[c]!;
        const related = hyphae[other]!.parent === t.h || hy.parent === other;
        if (!related && rnd() < 0.5) fused = true;
      }

      sx1.push(t.x);
      sy1.push(t.y);
      sx2.push(nx);
      sy2.push(ny);
      sTick.push(tick);
      hy.segs.push(sx1.length - 1);
      if (c >= 0) {
        if (dens[c]! < 255) dens[c]!++;
        owner[c] = t.h;
      }
      t.x = nx;
      t.y = ny;

      if (fused || t.life <= 0) {
        tips.splice(i, 1);
        continue;
      }

      // sub-apical branching
      t.gap--;
      const local = c >= 0 ? dens[c]! : 0;
      const g = weight(nx, ny);
      const pB =
        (compact ? 0.12 : 0.14) *
        g *
        (local > 4 ? 0.3 : 1) *
        (tips.length > MAX_TIPS ? 0 : 1);
      if (t.gap <= 0 && rnd() < pB && hy.segs.length > 4) {
        const back = Math.min(hy.segs.length - 1, 3 + Math.floor(rnd() * 6));
        const sIdx = hy.segs[hy.segs.length - 1 - back]!;
        const bx = sx2[sIdx]!;
        const by = sy2[sIdx]!;
        const pa = Math.atan2(sy2[sIdx]! - sy1[sIdx]!, sx2[sIdx]! - sx1[sIdx]!);
        const ang = (0.6 + rnd() * 0.6) * t.side;
        t.side = -t.side;
        t.gap = 3 + rnd() * 7;
        const child = newHypha(t.h, hy.segs.length - 1 - back);
        spawn(child, bx, by, pa + ang, branchLife() * (0.5 + 0.5 * g), bx, by);
      }

      // tips over the text column die off a little earlier
      if ((g < 0.6 && rnd() < (0.6 - g) * 0.012) || (local > 6 && rnd() < 0.25))
        tips.splice(i, 1);
    }
    tick++;
  }

  const n = sx1.length;

  // ---- pipe model widths -------------------------------------------------
  // fed[s] = mycelium length (px) downstream of raw segment s
  const fed = new Float32Array(n);
  const subtree = new Float32Array(hyphae.length);
  for (let h = hyphae.length - 1; h >= 0; h--) {
    // children always have larger ids than their parents
    const hy = hyphae[h]!;
    const byAt = new Map<number, number>();
    for (const ch of hy.children) {
      const at = hyphae[ch]!.at;
      byAt.set(at, (byAt.get(at) ?? 0) + subtree[ch]!);
    }
    let acc = 0;
    for (let j = hy.segs.length - 1; j >= 0; j--) {
      const s = hy.segs[j]!;
      acc += Math.hypot(sx2[s]! - sx1[s]!, sy2[s]! - sy1[s]!);
      acc += byAt.get(j) ?? 0;
      fed[s] = acc;
    }
    subtree[h] = acc;
  }

  // ---- entries -------------------------------------------------------------
  const entries: Entry[] = [];
  const THICK_DELAY = compact ? 380 : 520;

  // hyphae: a thin first pass, later a thickening pass for strands that feed a lot
  const segKey = (s: number) => keyOfTick(sTick[s]!);
  for (const hy of hyphae) {
    for (let j = 0; j < hy.segs.length; j++) {
      const s = hy.segs[j]!;
      const next = j + 1 < hy.segs.length ? segKey(hy.segs[j + 1]!) : Infinity;
      const w = Math.min(
        compact ? 1.7 : 2.1,
        0.45 + 0.009 * Math.sqrt(fed[s]!) * (compact ? 0.9 : 1),
      );
      const a = weight((sx1[s]! + sx2[s]!) / 2, (sy1[s]! + sy2[s]!) / 2);
      const base = {
        x1: sx1[s]!,
        y1: sy1[s]!,
        x2: sx2[s]!,
        y2: sy2[s]!,
        kind: KIND_HYPHA,
      };
      entries.push({ ...base, w: Math.min(w, 0.65), a, k: segKey(s), next });
      if (w > 0.95)
        entries.push({
          ...base,
          w,
          a: a * 0.9,
          k: segKey(s) + THICK_DELAY,
          next: Infinity,
        });
    }
  }

  // cord: glow band + strand bundle; revealed by the furthest y reached so far
  {
    const strands = compact
      ? [
          [0, 2.0],
          [4, 1.3],
          [-5, 1.1],
          [7, 0.9],
          [-8, 1.4],
        ]
      : [
          [0, 2.4],
          [5, 1.6],
          [-6, 1.3],
          [3, 1.1],
          [-9, 1.8],
          [8, 1.0],
          [-3, 1.4],
          [11, 0.9],
        ];
    const phase = strands.map(() => [
      rndCord() * 6.28,
      rndCord() * 6.28,
      200 + rndCord() * 200,
    ]);
    const keys = new Float32Array(cord.length);
    let m = -Infinity;
    for (let i = 0; i < cord.length; i++) {
      m = Math.max(m, cord[i]!.y);
      keys[i] = m;
    }
    const glowW = compact ? 18 : 26;
    for (let i = 0; i + 1 < cord.length; i++) {
      const p = cord[i]!;
      const q = cord[i + 1]!;
      const k = keys[i + 1]!;
      const next = i + 2 < cord.length ? keys[i + 2]! : Infinity;
      entries.push({
        x1: p.x,
        y1: p.y,
        x2: q.x,
        y2: q.y,
        w: glowW,
        a: 1,
        k,
        next: Infinity,
        kind: KIND_GLOW,
      });
      strands.forEach(([base, w], j) => {
        const [p1, p2, per] = phase[j]!;
        // strands drift apart and back together, with a little fine wobble
        const off = (s: number) =>
          base! * (0.55 + 0.6 * Math.sin(s / per! + p1!)) +
          2.2 * Math.sin(s / 37 + p2!);
        const o1 = off(p.s);
        const o2 = off(q.s);
        entries.push({
          x1: p.x + p.nx * o1,
          y1: p.y + p.ny * o1,
          x2: q.x + q.nx * o2,
          y2: q.y + q.ny * o2,
          w: w! * (compact ? 0.85 : 1),
          a: 1,
          k,
          next,
          kind: KIND_STRAND,
        });
      });
    }
  }

  entries.sort((p, q) => p.k - q.k);

  const count = entries.length;
  const pos = new Float32Array(count * 4);
  const width = new Float32Array(count);
  const alpha = new Float32Array(count);
  const key = new Float32Array(count);
  const kind = new Uint8Array(count);
  const next = new Float32Array(count);
  entries.forEach((e, i) => {
    pos[i * 4] = e.x1;
    pos[i * 4 + 1] = e.y1;
    pos[i * 4 + 2] = e.x2;
    pos[i * 4 + 3] = e.y2;
    width[i] = e.w;
    alpha[i] = e.a;
    key[i] = e.k;
    kind[i] = e.kind;
    next[i] = e.next;
  });
  return { W, H, count, pos, width, alpha, key, kind, next };
}
