import { z } from "zod";

export const IssueSeveritySchema = z.enum(["error", "warning", "info"]);

export const IssueCategorySchema = z.enum([
  "design-system-drift",
  "duplicate-component",
  "repeated-inline-jsx",
  "responsive-layout",
  "accessibility",
  "arbitrary-value",
  "missing-alt-text",
  "contrast-violation",
  "broken-layout",
]);

export const CodeLocationSchema = z.object({
  filePath: z.string(),
  line: z.number(),
  column: z.number(),
  endLine: z.number().optional(),
  endColumn: z.number().optional(),
});

export const SuggestedFixSchema = z.object({
  description: z.string(),
  diff: z.string().optional(),
  replacementText: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  isAutoFixable: z.boolean().default(false),
});

export const AuditIssueSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  category: IssueCategorySchema,
  severity: IssueSeveritySchema,
  message: z.string(),
  location: CodeLocationSchema,
  snippet: z.string().optional(),
  suggestedFix: SuggestedFixSchema.optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export const AuditReportSchema = z.object({
  timestamp: z.string(),
  targetPath: z.string(),
  totalIssues: z.number(),
  errorsCount: z.number(),
  warningsCount: z.number(),
  issues: z.array(AuditIssueSchema),
  summary: z.string(),
});
