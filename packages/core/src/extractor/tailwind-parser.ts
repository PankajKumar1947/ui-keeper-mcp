import { readFileSync, existsSync } from "node:fs";
import * as path from "node:path";
import type {
  ColorToken,
  SpacingToken,
  RadiusToken,
  ShadowToken,
  BreakpointToken,
  TypographyToken,
} from "../types";

export const DEFAULT_TAILWIND_SPACING: SpacingToken[] = [
  { name: "0", value: "0px", pxValue: 0 },
  { name: "0.5", value: "0.125rem", pxValue: 2 },
  { name: "1", value: "0.25rem", pxValue: 4 },
  { name: "1.5", value: "0.375rem", pxValue: 6 },
  { name: "2", value: "0.5rem", pxValue: 8 },
  { name: "2.5", value: "0.625rem", pxValue: 10 },
  { name: "3", value: "0.75rem", pxValue: 12 },
  { name: "3.5", value: "0.875rem", pxValue: 14 },
  { name: "4", value: "1rem", pxValue: 16 },
  { name: "5", value: "1.25rem", pxValue: 20 },
  { name: "6", value: "1.5rem", pxValue: 24 },
  { name: "7", value: "1.75rem", pxValue: 28 },
  { name: "8", value: "2rem", pxValue: 32 },
  { name: "9", value: "2.25rem", pxValue: 36 },
  { name: "10", value: "2.5rem", pxValue: 40 },
  { name: "11", value: "2.75rem", pxValue: 44 },
  { name: "12", value: "3rem", pxValue: 48 },
  { name: "14", value: "3.5rem", pxValue: 56 },
  { name: "16", value: "4rem", pxValue: 64 },
  { name: "20", value: "5rem", pxValue: 80 },
  { name: "24", value: "6rem", pxValue: 96 },
  { name: "28", value: "7rem", pxValue: 112 },
  { name: "32", value: "8rem", pxValue: 128 },
  { name: "36", value: "9rem", pxValue: 144 },
  { name: "40", value: "10rem", pxValue: 160 },
  { name: "44", value: "11rem", pxValue: 176 },
  { name: "48", value: "12rem", pxValue: 192 },
  { name: "52", value: "13rem", pxValue: 208 },
  { name: "56", value: "14rem", pxValue: 224 },
  { name: "60", value: "15rem", pxValue: 240 },
  { name: "64", value: "16rem", pxValue: 256 },
  { name: "72", value: "18rem", pxValue: 288 },
  { name: "80", value: "20rem", pxValue: 320 },
  { name: "96", value: "24rem", pxValue: 384 },
];

export const DEFAULT_TAILWIND_RADIUS: RadiusToken[] = [
  { name: "none", value: "0px", pxValue: 0 },
  { name: "sm", value: "0.125rem", pxValue: 2 },
  { name: "DEFAULT", value: "0.25rem", pxValue: 4 },
  { name: "md", value: "0.375rem", pxValue: 6 },
  { name: "lg", value: "0.5rem", pxValue: 8 },
  { name: "xl", value: "0.75rem", pxValue: 12 },
  { name: "2xl", value: "1rem", pxValue: 16 },
  { name: "3xl", value: "1.5rem", pxValue: 24 },
  { name: "full", value: "9999px", pxValue: 9999 },
];

export const DEFAULT_TAILWIND_BREAKPOINTS: BreakpointToken[] = [
  { name: "sm", raw: "640px", minWidth: 640 },
  { name: "md", raw: "768px", minWidth: 768 },
  { name: "lg", raw: "1024px", minWidth: 1024 },
  { name: "xl", raw: "1280px", minWidth: 1280 },
  { name: "2xl", raw: "1536px", minWidth: 1536 },
];

export const DEFAULT_TAILWIND_SHADOWS: ShadowToken[] = [
  { name: "sm", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { name: "DEFAULT", value: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" },
  { name: "md", value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
  { name: "lg", value: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" },
  { name: "xl", value: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" },
  { name: "2xl", value: "0 25px 50px -12px rgb(0 0 0 / 0.25)" },
  { name: "inner", value: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)" },
  { name: "none", value: "0 0 #0000" },
];

export const DEFAULT_TAILWIND_COLORS: ColorToken[] = [
  { name: "black", value: "#000000", hex: "#000000" },
  { name: "white", value: "#ffffff", hex: "#ffffff" },
  { name: "slate-50", value: "#f8fafc", hex: "#f8fafc" },
  { name: "slate-100", value: "#f1f5f9", hex: "#f1f5f9" },
  { name: "slate-200", value: "#e2e8f0", hex: "#e2e8f0" },
  { name: "slate-300", value: "#cbd5e1", hex: "#cbd5e1" },
  { name: "slate-400", value: "#94a3b8", hex: "#94a3b8" },
  { name: "slate-500", value: "#64748b", hex: "#64748b" },
  { name: "slate-600", value: "#475569", hex: "#475569" },
  { name: "slate-700", value: "#334155", hex: "#334155" },
  { name: "slate-800", value: "#1e293b", hex: "#1e293b" },
  { name: "slate-900", value: "#0f172a", hex: "#0f172a" },
  { name: "slate-950", value: "#020617", hex: "#020617" },
  { name: "blue-500", value: "#3b82f6", hex: "#3b82f6" },
  { name: "blue-600", value: "#2563eb", hex: "#2563eb" },
  { name: "red-500", value: "#ef4444", hex: "#ef4444" },
  { name: "green-500", value: "#22c55e", hex: "#22c55e" },
  { name: "amber-500", value: "#f59e0b", hex: "#f59e0b" },
  { name: "purple-500", value: "#a855f7", hex: "#a855f7" },
];

export function parseTailwindConfig(configFilePath: string): {
  colors: ColorToken[];
  spacing: SpacingToken[];
  radius: RadiusToken[];
  breakpoints: BreakpointToken[];
} {
  const customColors: ColorToken[] = [];
  const customSpacing: SpacingToken[] = [];
  const customRadius: RadiusToken[] = [];
  const customBreakpoints: BreakpointToken[] = [];

  if (!existsSync(configFilePath)) {
    return {
      colors: customColors,
      spacing: customSpacing,
      radius: customRadius,
      breakpoints: customBreakpoints,
    };
  }

  try {
    const rawConfig = readFileSync(configFilePath, "utf-8");

    // Extract custom colors e.g. brand: '#123456' or 'brand-500': 'rgb(...)'
    const colorMatches = rawConfig.matchAll(/(['"])?([a-zA-Z0-9_-]+)\1?\s*:\s*(['"])(#[0-9a-fA-F]{3,8}|rgba?\(.+?\)|hsla?\(.+?\))\3/g);
    for (const match of colorMatches) {
      const name = match[2];
      const val = match[4];
      if (name && val) {
        customColors.push({
          name,
          value: val,
          hex: val.startsWith("#") ? val : undefined,
        });
      }
    }

    // Extract custom spacing e.g. '128': '32rem'
    const spacingMatches = rawConfig.matchAll(/(['"])?([0-9.]+)\1?\s*:\s*(['"])([0-9.]+(?:px|rem|em))\3/g);
    for (const match of spacingMatches) {
      const name = match[2];
      const val = match[4];
      let px = 0;
      if (val.endsWith("px")) px = parseFloat(val);
      if (val.endsWith("rem")) px = parseFloat(val) * 16;
      customSpacing.push({ name, value: val, pxValue: px });
    }
  } catch {
    // Config parsing error fallback
  }

  return {
    colors: customColors,
    spacing: customSpacing,
    radius: customRadius,
    breakpoints: customBreakpoints,
  };
}
