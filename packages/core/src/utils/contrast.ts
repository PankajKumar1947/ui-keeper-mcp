import { normalizeToRgb, type RGB } from "./color";

function getRelativeLuminance(rgb: RGB): number {
  const normalize = (channel: number) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function calculateContrastRatio(colorA: string, colorB: string): number | null {
  const rgbA = normalizeToRgb(colorA);
  const rgbB = normalizeToRgb(colorB);
  if (!rgbA || !rgbB) return null;

  const lumA = getRelativeLuminance(rgbA);
  const lumB = getRelativeLuminance(rgbB);

  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function isWcagCompliant(
  ratio: number,
  isLargeText: boolean = false,
  level: "AA" | "AAA" = "AA"
): boolean {
  if (level === "AAA") {
    return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
  }
  // Level AA
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}
