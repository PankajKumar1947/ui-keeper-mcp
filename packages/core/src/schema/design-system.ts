import { z } from "zod";

export const ColorRoleSchema = z.enum([
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "text",
  "muted",
  "border",
  "destructive",
  "success",
  "warning",
  "info",
  "custom",
]);

export const ColorTokenSchema = z.object({
  name: z.string(),
  value: z.string(),
  role: ColorRoleSchema.optional(),
  hex: z.string().optional(),
  rgb: z.string().optional(),
  hsl: z.string().optional(),
  opacity: z.number().optional(),
  cssVar: z.string().optional(),
});

export const SpacingTokenSchema = z.object({
  name: z.string(),
  value: z.string(),
  pxValue: z.number(),
});

export const TypographyTokenSchema = z.object({
  name: z.string(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
});

export const RadiusTokenSchema = z.object({
  name: z.string(),
  value: z.string(),
  pxValue: z.number().optional(),
});

export const ShadowTokenSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const BreakpointTokenSchema = z.object({
  name: z.string(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
  raw: z.string(),
});

export const FrameworkTypeSchema = z.enum([
  "react",
  "nextjs",
  "vite",
  "vue",
  "svelte",
  "astro",
  "unknown",
]);

export const StylingEngineSchema = z.enum([
  "tailwind",
  "css-modules",
  "vanilla-css",
  "styled-components",
  "unknown",
]);

export const DesignSystemSchema = z.object({
  version: z.string().default("1.0.0"),
  framework: FrameworkTypeSchema.default("unknown"),
  stylingEngine: StylingEngineSchema.default("unknown"),
  colors: z.array(ColorTokenSchema).default([]),
  spacing: z.array(SpacingTokenSchema).default([]),
  typography: z.array(TypographyTokenSchema).default([]),
  radius: z.array(RadiusTokenSchema).default([]),
  shadows: z.array(ShadowTokenSchema).default([]),
  breakpoints: z.array(BreakpointTokenSchema).default([]),
  customTokens: z.record(z.string(), z.any()).optional(),
});
