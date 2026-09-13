import * as path from "node:path";
import type { ProjectConfig, DesignSystem, ColorToken, SpacingToken, RadiusToken, ShadowToken, BreakpointToken, TypographyToken } from "../types";
import { parseCssFiles } from "./css-variable-parser";
import {
  parseTailwindConfig,
  DEFAULT_TAILWIND_COLORS,
  DEFAULT_TAILWIND_SPACING,
  DEFAULT_TAILWIND_RADIUS,
  DEFAULT_TAILWIND_SHADOWS,
  DEFAULT_TAILWIND_BREAKPOINTS,
} from "./tailwind-parser";

export function extractTokens(config: ProjectConfig): DesignSystem {
  const rootDir = config.rootDir;

  // 1. Parse CSS variables
  const cssVars = parseCssFiles(rootDir, config.globalCssPaths);

  // 2. Parse Tailwind if configured
  const colorsMap = new Map<string, ColorToken>();
  const spacingMap = new Map<string, SpacingToken>();
  const radiusMap = new Map<string, RadiusToken>();
  const shadowMap = new Map<string, ShadowToken>();
  const breakpointMap = new Map<string, BreakpointToken>();
  const typographyMap = new Map<string, TypographyToken>();

  if (config.stylingEngine === "tailwind") {
    // Add default tailwind tokens
    for (const c of DEFAULT_TAILWIND_COLORS) colorsMap.set(c.name, c);
    for (const s of DEFAULT_TAILWIND_SPACING) spacingMap.set(s.name, s);
    for (const r of DEFAULT_TAILWIND_RADIUS) radiusMap.set(r.name, r);
    for (const sh of DEFAULT_TAILWIND_SHADOWS) shadowMap.set(sh.name, sh);
    for (const bp of DEFAULT_TAILWIND_BREAKPOINTS) breakpointMap.set(bp.name, bp);

    // Override/extend with custom tailwind config
    if (config.tailwindConfigPath) {
      const customTw = parseTailwindConfig(path.join(rootDir, config.tailwindConfigPath));
      for (const c of customTw.colors) colorsMap.set(c.name, c);
      for (const s of customTw.spacing) spacingMap.set(s.name, s);
      for (const r of customTw.radius) radiusMap.set(r.name, r);
      for (const bp of customTw.breakpoints) breakpointMap.set(bp.name, bp);
    }
  }

  // 3. Merge CSS variables (overrides defaults)
  for (const c of cssVars.colors) colorsMap.set(c.name, c);
  for (const s of cssVars.spacing) spacingMap.set(s.name, s);
  for (const r of cssVars.radius) radiusMap.set(r.name, r);
  for (const t of cssVars.typography) typographyMap.set(t.name, t);

  return {
    version: "1.0.0",
    framework: config.framework,
    stylingEngine: config.stylingEngine,
    colors: Array.from(colorsMap.values()),
    spacing: Array.from(spacingMap.values()),
    typography: Array.from(typographyMap.values()),
    radius: Array.from(radiusMap.values()),
    shadows: Array.from(shadowMap.values()),
    breakpoints: Array.from(breakpointMap.values()),
  };
}
