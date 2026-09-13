import { readFileSync, existsSync } from "node:fs";
import * as path from "node:path";
import type { ColorToken, SpacingToken, RadiusToken, TypographyToken } from "../types";
import { parseHex, parseRgbString, parseHslString, rgbToHex, hslToRgb } from "../utils/color";

export interface ParsedCssVariables {
  colors: ColorToken[];
  spacing: SpacingToken[];
  radius: RadiusToken[];
  typography: TypographyToken[];
}

export function parseCssContent(cssContent: string): ParsedCssVariables {
  const colors: ColorToken[] = [];
  const spacing: SpacingToken[] = [];
  const radius: RadiusToken[] = [];
  const typography: TypographyToken[] = [];

  // Match all CSS variable definitions: --name: value;
  const varRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(cssContent)) !== null) {
    const varName = match[1].trim();
    const rawVal = match[2].trim();
    const fullVar = `--${varName}`;

    // 1. Check if color
    const hex = parseHex(rawVal);
    const rgb = parseRgbString(rawVal);
    const hsl = parseHslString(rawVal);

    if (hex) {
      colors.push({
        name: varName,
        value: rawVal,
        cssVar: fullVar,
        hex: rawVal.startsWith("#") ? rawVal : rgbToHex(hex),
      });
      continue;
    } else if (rgb) {
      colors.push({
        name: varName,
        value: rawVal,
        cssVar: fullVar,
        hex: rgbToHex(rgb),
        rgb: rawVal,
      });
      continue;
    } else if (hsl) {
      const rgbFromHsl = hslToRgb(hsl);
      colors.push({
        name: varName,
        value: rawVal,
        cssVar: fullVar,
        hex: rgbToHex(rgbFromHsl),
        hsl: rawVal,
      });
      continue;
    } else if (/^(hsl|rgb|oklch)\(/.test(rawVal) || /color/i.test(varName) || /bg|foreground|primary|secondary|accent|muted|destructive|border/i.test(varName)) {
      // It's likely a color (e.g. Tailwind / shadcn format `222.2 84% 4.9%` or `oklch(...)`)
      colors.push({
        name: varName,
        value: rawVal,
        cssVar: fullVar,
      });
      continue;
    }

    // 2. Check if radius
    if (/radius/i.test(varName) || /rounded/i.test(varName)) {
      let pxVal: number | undefined;
      if (rawVal.endsWith("px")) {
        pxVal = parseFloat(rawVal);
      } else if (rawVal.endsWith("rem")) {
        pxVal = parseFloat(rawVal) * 16;
      }
      radius.push({
        name: varName,
        value: rawVal,
        pxValue: pxVal,
      });
      continue;
    }

    // 3. Check if spacing
    if (/spacing|gap|padding|margin|space/i.test(varName)) {
      let pxVal = 0;
      if (rawVal.endsWith("px")) {
        pxVal = parseFloat(rawVal);
      } else if (rawVal.endsWith("rem")) {
        pxVal = parseFloat(rawVal) * 16;
      }
      spacing.push({
        name: varName,
        value: rawVal,
        pxValue: pxVal,
      });
      continue;
    }

    // 4. Check if typography
    if (/font/i.test(varName)) {
      typography.push({
        name: varName,
        fontFamily: rawVal,
      });
    }
  }

  return { colors, spacing, radius, typography };
}

export function parseCssFiles(rootDir: string, cssFilePaths: string[]): ParsedCssVariables {
  const result: ParsedCssVariables = {
    colors: [],
    spacing: [],
    radius: [],
    typography: [],
  };

  for (const relPath of cssFilePaths) {
    const fullPath = path.isAbsolute(relPath) ? relPath : path.join(rootDir, relPath);
    if (!existsSync(fullPath)) continue;
    try {
      const content = readFileSync(fullPath, "utf-8");
      const parsed = parseCssContent(content);
      result.colors.push(...parsed.colors);
      result.spacing.push(...parsed.spacing);
      result.radius.push(...parsed.radius);
      result.typography.push(...parsed.typography);
    } catch {
      // Continue parsing other files on read errors
    }
  }

  return result;
}
