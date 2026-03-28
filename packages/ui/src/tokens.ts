/**
 * Shroom-Mates Design Tokens (TypeScript)
 * Use in JS/TS contexts where CSS custom properties aren't available.
 */

export const colors = {
  accent: "#ff4908",
  accentLight: "#ff9c7e",
  accentDark: "#bf2300",
  text: "#1d1d1d",
  bg: "#ffffff",
  bgAccent: "#fdfcea",
  focus: "#5f5f5f",
} as const;

export const fonts = {
  body: '"Geist Sans", system-ui, sans-serif',
  mono: '"DM Mono", monospace',
} as const;

export const navbar = {
  height: "7.5rem",
  heightScrolled: "5.5rem",
  heightMobile: "4.5rem",
  heightMobileScrolled: "3.5rem",
} as const;

export const easing = {
  smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/**
 * Calculate readable text color for a given background.
 * Returns "black" or "white" based on luminance contrast.
 */
export function readableTextColor(hexBg: string): "black" | "white" {
  const hex = hexBg.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Relative luminance formula (WCAG 2.0)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "black" : "white";
}
