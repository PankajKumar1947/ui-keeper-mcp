export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export function parseHex(hex: string): RGB | null {
  const trimmed = hex.trim();
  if (!trimmed.startsWith("#") && !/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    return null;
  }
  let cleaned = trimmed.replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    return null;
  }
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (cleaned.length === 6) {
    const num = parseInt(cleaned, 16);
    if (isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }
  if (cleaned.length === 8) {
    const num = parseInt(cleaned, 16);
    if (isNaN(num)) return null;
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: (num & 255) / 255,
    };
  }
  return null;
}

export function parseRgbString(rgbStr: string): RGB | null {
  const match = rgbStr.trim().match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)$/i);
  if (!match) return null;
  return {
    r: Math.min(255, Math.max(0, parseInt(match[1], 10))),
    g: Math.min(255, Math.max(0, parseInt(match[2], 10))),
    b: Math.min(255, Math.max(0, parseInt(match[3], 10))),
    a: match[4] !== undefined ? parseFloat(match[4]) : undefined,
  };
}

export function parseHslString(hslStr: string): HSL | null {
  const match = hslStr.trim().match(/^hsla?\(\s*(\d+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?(?:[,\s/]+([\d.]+))?\s*\)$/i);
  if (!match) return null;
  return {
    h: parseInt(match[1], 10),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
    a: match[4] !== undefined ? parseFloat(match[4]) : undefined,
  };
}


export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsl.a,
  };
}

export function normalizeToRgb(color: string): RGB | null {
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) {
    return parseHex(trimmed);
  }
  if (trimmed.startsWith("rgb")) {
    return parseRgbString(trimmed);
  }
  if (trimmed.startsWith("hsl")) {
    const hsl = parseHslString(trimmed);
    return hsl ? hslToRgb(hsl) : null;
  }
  return null;
}

/**
 * Calculates Euclidean distance between two colors in RGB space (0 to ~441).
 * Distance < 15 is considered almost identical.
 * Distance < 35 is considered a near-match.
 */
export function colorDistance(colorA: string, colorB: string): number | null {
  const rgbA = normalizeToRgb(colorA);
  const rgbB = normalizeToRgb(colorB);
  if (!rgbA || !rgbB) return null;

  const dr = rgbA.r - rgbB.r;
  const dg = rgbA.g - rgbB.g;
  const db = rgbA.b - rgbB.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}
