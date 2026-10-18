/**
 * Shroom-Mates Design Tokens (TypeScript)
 * Use in JS/TS contexts where CSS custom properties aren't available.
 */

export const colors = {
  accent: "#ff4908",
  accentLight: "#ff9c7e",
  accentDark: "#bf2300",
  text: "#1c1a33",
  bg: "#e9eaff",
  bgAccent: "#fffdf5",
  cream: "#fffdf5",
  paper: "#d7d9fc",
  ink: "#1c1a33",
  night: "#13122a",
  lavender: "#9fa2f7",
  pink: "#ffc4d2",
  oliveSoft: "#f2ec8a",
  olive: "#7e8503",
  indigo: "#3d41b8",
  stone: "#7c7da6",
  green: "#36e27b",
  focus: "#5f5f5f",
} as const;

export const fonts = {
  display: '"Fraunces Variable", "Fraunces", Georgia, serif',
  body: '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif',
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
