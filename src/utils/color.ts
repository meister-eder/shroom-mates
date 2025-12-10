/**
 * Helper: choose readable text color (black or white) based on a hex/rgb background
 */
export const readableTextColor = (bg: string | undefined): string => {
  if (!bg) return "#111";
  try {
    const hexMatch = bg.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    let r: number, g: number, b: number;
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
    } else {
      const rgbMatch = bg.match(/rgba?\(([^)]+)\)/i);
      if (rgbMatch) {
        const parts = rgbMatch[1]
          .split(",")
          .map((s: string) => parseFloat(s.trim()));
        r = parts[0];
        g = parts[1];
        b = parts[2];
      } else {
        return "#111";
      }
    }

    const [R, G, B] = [r, g, b].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    return lum > 0.5 ? "#111" : "#fff";
  } catch {
    return "#111";
  }
};
