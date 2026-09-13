import { z } from "zod";

export const InspectDesignSystemInputSchema = z.object({
  rootDir: z.string().optional().describe("Optional project root directory"),
});

export const InspectUiInputSchema = z.object({
  rootDir: z.string().optional().describe("Optional project root directory"),
});

export const AuditUiInputSchema = z.object({
  rootDir: z.string().optional().describe("Project root directory"),
  targetPath: z.string().optional().describe("Optional specific file or directory path to audit"),
});

export const GetUiHealthScoreInputSchema = z.object({
  rootDir: z.string().optional().describe("Project root directory"),
  targetPath: z.string().optional().describe("Optional file or directory to score"),
});

export const ScaffoldComponentInputSchema = z.object({
  name: z.string().describe("Component name e.g. ProjectCard"),
  category: z
    .enum(["card", "button", "badge", "stat", "input", "section", "other"])
    .optional()
    .describe("Component category type"),
  rootDir: z.string().optional().describe("Project root directory"),
  writeToFile: z.boolean().optional().describe("If true, saves component file directly to disk"),
});

export const FindComponentInputSchema = z.object({
  query: z.string().describe("Search keyword (e.g. 'button', 'card', 'modal', 'input')"),
  category: z.string().optional().describe("Optional component category filter"),
  rootDir: z.string().optional().describe("Project root directory"),
});

export const FindDesignTokenInputSchema = z.object({
  type: z.enum(["color", "spacing", "radius"]).describe("Token category type"),
  value: z.string().describe("The raw value to search for (e.g. '#1e293b' or '16px')"),
  rootDir: z.string().optional().describe("Project root directory"),
});

export const ApplyUiFixInputSchema = z.object({
  rootDir: z.string().optional().describe("Project root directory"),
  targetPath: z.string().optional().describe("Optional file or directory to fix"),
});

export const AuditCodeInputSchema = z.object({
  code: z.string().describe("JSX / TSX source code to audit"),
  filePath: z.string().optional().describe("Optional relative file path e.g. components/Button.tsx"),
  cssContent: z.string().optional().describe("Optional CSS variables or tokens from globals.css or token.css"),
});

export const ExtractTokensInputSchema = z.object({
  cssContent: z.string().describe("Raw CSS content containing CSS variables or tokens (e.g. from token.css)"),
});

