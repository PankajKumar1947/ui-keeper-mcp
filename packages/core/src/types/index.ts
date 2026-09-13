import { z } from "zod";
import * as schemas from "../schema";

export type ColorRole = z.infer<typeof schemas.ColorRoleSchema>;
export type ColorToken = z.infer<typeof schemas.ColorTokenSchema>;
export type SpacingToken = z.infer<typeof schemas.SpacingTokenSchema>;
export type TypographyToken = z.infer<typeof schemas.TypographyTokenSchema>;
export type RadiusToken = z.infer<typeof schemas.RadiusTokenSchema>;
export type ShadowToken = z.infer<typeof schemas.ShadowTokenSchema>;
export type BreakpointToken = z.infer<typeof schemas.BreakpointTokenSchema>;
export type FrameworkType = z.infer<typeof schemas.FrameworkTypeSchema>;
export type StylingEngine = z.infer<typeof schemas.StylingEngineSchema>;
export type DesignSystem = z.infer<typeof schemas.DesignSystemSchema>;

export type ComponentCategory = z.infer<typeof schemas.ComponentCategorySchema>;
export type ComponentProp = z.infer<typeof schemas.ComponentPropSchema>;
export type ComponentVariant = z.infer<typeof schemas.ComponentVariantSchema>;
export type ComponentEntry = z.infer<typeof schemas.ComponentEntrySchema>;
export type ComponentCatalog = z.infer<typeof schemas.ComponentCatalogSchema>;

export type RouteType = z.infer<typeof schemas.RouteTypeSchema>;
export type RouteEntry = z.infer<typeof schemas.RouteEntrySchema>;
export type ProjectConfig = z.infer<typeof schemas.ProjectConfigSchema>;
export type ProjectModel = z.infer<typeof schemas.ProjectModelSchema>;

export type IssueSeverity = z.infer<typeof schemas.IssueSeveritySchema>;
export type IssueCategory = z.infer<typeof schemas.IssueCategorySchema>;
export type CodeLocation = z.infer<typeof schemas.CodeLocationSchema>;
export type SuggestedFix = z.infer<typeof schemas.SuggestedFixSchema>;
export type AuditIssue = z.infer<typeof schemas.AuditIssueSchema>;
export type AuditReport = z.infer<typeof schemas.AuditReportSchema>;

export type ViewportConfig = z.infer<typeof schemas.ViewportConfigSchema>;
export type OverflowIssue = z.infer<typeof schemas.OverflowIssueSchema>;
export type A11yViolation = z.infer<typeof schemas.A11yViolationSchema>;
export type BrowserCheckResult = z.infer<typeof schemas.BrowserCheckResultSchema>;

export type HealthScore = z.infer<typeof schemas.HealthScoreSchema>;
export type HealthGrade = z.infer<typeof schemas.HealthGradeSchema>;

export type InspectDesignSystemInput = z.infer<typeof schemas.InspectDesignSystemInputSchema>;
export type InspectUiInput = z.infer<typeof schemas.InspectUiInputSchema>;
export type AuditUiInput = z.infer<typeof schemas.AuditUiInputSchema>;
export type GetUiHealthScoreInput = z.infer<typeof schemas.GetUiHealthScoreInputSchema>;
export type ScaffoldComponentInput = z.infer<typeof schemas.ScaffoldComponentInputSchema>;
export type FindComponentInput = z.infer<typeof schemas.FindComponentInputSchema>;
export type FindDesignTokenInput = z.infer<typeof schemas.FindDesignTokenInputSchema>;
export type ApplyUiFixInput = z.infer<typeof schemas.ApplyUiFixInputSchema>;

