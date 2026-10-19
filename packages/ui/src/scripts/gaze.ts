/**
 * Where the mates should look, shared by every pair of drawn eyes (logo
 * mascot, footer crowd, shop mascot).
 *
 * - Mouse: the pointer position, as long as it is on the page.
 * - Touch (phones have no hover pointer): the last tap / drag point, for a
 *   few seconds.
 * - Tilt: the phone's tilt as a direction, where the browser sends
 *   orientation events without a permission prompt (Android; iOS would need
 *   one, so it is skipped).
 * - Scroll: while the page scrolls the mates watch it go by (look up when
 *   scrolling down and the other way round).
 * - Otherwise `null`: each component falls back to its resting gaze.
 *
 * Points are client coordinates; directions are -1..1 per axis.
 */
export type Gaze =
  | { kind: "point"; x: number; y: number }
  | { kind: "dir"; x: number; y: number }
  | null;

type Listener = (gaze: Gaze) => void;

const TOUCH_MS = 2500;
const TILT_MS = 1500;
const SCROLL_MS = 900;

const listeners = new Set<Listener>();
let mouse: { x: number; y: number } | null = null;
let touch: { x: number; y: number; at: number } | null = null;
let tilt: { x: number; y: number; at: number } | null = null;
let scroll: { y: number; at: number } | null = null;
let lastScrollY = 0;
let expiry = 0;
let started = false;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function current(now = performance.now()): Gaze {
  if (mouse) return { kind: "point", ...mouse };
  if (touch && now - touch.at < TOUCH_MS) return { kind: "point", x: touch.x, y: touch.y };
  if (tilt && now - tilt.at < TILT_MS) return { kind: "dir", x: tilt.x, y: tilt.y };
  if (scroll && now - scroll.at < SCROLL_MS) return { kind: "dir", x: 0, y: scroll.y };
  return null;
}

function emit() {
  const gaze = current();
  for (const l of listeners) l(gaze);
  // re-emit once the newest short-lived source has run out
  clearTimeout(expiry);
  if (!mouse && gaze) expiry = window.setTimeout(emit, 300);
}

function start() {
  if (started) return;
  started = true;
  lastScrollY = scrollY;
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "mouse") mouse = { x: e.clientX, y: e.clientY };
      else touch = { x: e.clientX, y: e.clientY, at: performance.now() };
      emit();
    },
    { passive: true },
  );
  addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "mouse") return;
      touch = { x: e.clientX, y: e.clientY, at: performance.now() };
      emit();
    },
    { passive: true },
  );
  document.documentElement.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      mouse = null;
      emit();
    }
  });
  addEventListener("blur", () => {
    mouse = null;
    emit();
  });
  addEventListener(
    "scroll",
    () => {
      const dy = scrollY - lastScrollY;
      lastScrollY = scrollY;
      if (!dy) return;
      scroll = { y: clamp(-dy / 12), at: performance.now() };
      emit();
    },
    { passive: true },
  );
  addEventListener("deviceorientation", (e) => {
    if (e.gamma === null || e.beta === null) return;
    tilt = { x: clamp(e.gamma / 25), y: clamp((e.beta - 45) / 25), at: performance.now() };
    emit();
  });
}

/** Subscribe to gaze changes; returns the unsubscribe function. */
export function onGaze(listener: Listener): () => void {
  start();
  listeners.add(listener);
  listener(current());
  return () => listeners.delete(listener);
}

/**
 * Turn a gaze into a point to look at, for eyes around (cx, cy) in client
 * coordinates; directions become a point `reach` px away.
 */
export function gazePoint(gaze: Gaze, cx: number, cy: number, reach = 400) {
  if (!gaze) return null;
  if (gaze.kind === "point") return { x: gaze.x, y: gaze.y };
  return { x: cx + gaze.x * reach, y: cy + gaze.y * reach };
}
