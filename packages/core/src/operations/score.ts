import * as path from "node:path";
import type { HealthScore, HealthGrade } from "../schema/score";
import { analyzeProject } from "./analyze";
import { runAudit } from "../audit/engine";

export interface ScoreOptions {
  rootDir?: string;
  targetPath?: string;
}

export function calculateHealthScore(options: ScoreOptions = {}): HealthScore {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd();
  const projectModel = analyzeProject({ rootDir });
  const auditReport = runAudit({ targetPath: options.targetPath, projectModel });

  if (auditReport.auditedFilesCount === 0) {
    const errorMsg = auditReport.error || `No source files found to audit at '${options.targetPath || rootDir}'.`;
    return {
      overallScore: 0,
      grade: "F",
      tokenAdoptionScore: 0,
      componentReuseScore: 0,
      cleanlinessScore: 0,
      totalIssues: 0,
      errorsCount: 0,
      warningsCount: 0,
      summary: `Cannot calculate UI health score: ${errorMsg}`,
      recommendations: [
        `Ensure target directory '${options.targetPath || rootDir}' exists and contains valid .tsx/.jsx files.`,
        "If using a remote MCP server, note that it cannot access local filesystem paths.",
      ],
    };
  }

  const totalIssues = auditReport.totalIssues;
  const errors = auditReport.errorsCount;
  const warnings = auditReport.warningsCount;

  // 1. Token Adoption: Deduct for hardcoded colors, arbitrary values
  const tokenIssues = auditReport.issues.filter(
    (i) => i.ruleId === "no-hardcoded-colors" || i.ruleId === "no-arbitrary-spacing" || i.ruleId === "no-arbitrary-radius" || i.ruleId === "no-arbitrary-font-size"
  ).length;
  const tokenAdoptionScore = Math.max(0, Math.min(100, Math.round(100 - tokenIssues * 4)));

  // 2. Component Reuse: Deduct for duplicate components and repeated inline JSX
  const reuseIssues = auditReport.issues.filter(
    (i) => i.ruleId === "no-duplicate-components" || i.ruleId === "no-repeated-inline-jsx" || i.ruleId === "no-rebuilding-library-components"
  ).length;
  const componentReuseScore = Math.max(0, Math.min(100, Math.round(100 - reuseIssues * 6)));

  // 3. Cleanliness & Standards: Deduct for conflicts, contrast violations
  const cleanIssues = auditReport.issues.filter(
    (i) => i.ruleId === "no-conflicting-classes" || i.ruleId === "wcag-contrast-ratio"
  ).length;
  const cleanlinessScore = Math.max(0, Math.min(100, Math.round(100 - cleanIssues * 5)));

  // Weighted Overall Score: 35% Token + 35% Component Reuse + 30% Cleanliness
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(tokenAdoptionScore * 0.35 + componentReuseScore * 0.35 + cleanlinessScore * 0.3)
    )
  );

  let grade: HealthGrade = "F";
  if (overallScore >= 95) grade = "A+";
  else if (overallScore >= 85) grade = "A";
  else if (overallScore >= 75) grade = "B";
  else if (overallScore >= 60) grade = "C";
  else if (overallScore >= 45) grade = "D";

  const recommendations: string[] = [];
  if (tokenIssues > 0) recommendations.push(`Replace ${tokenIssues} arbitrary/hardcoded values with design tokens.`);
  if (reuseIssues > 0) recommendations.push(`Extract or reuse ${reuseIssues} duplicate/repeated component structures.`);
  if (cleanIssues > 0) recommendations.push(`Fix ${cleanIssues} class conflicts and contrast issues.`);
  if (recommendations.length === 0) recommendations.push("Excellent! Codebase strictly adheres to design system tokens and component reuse.");

  return {
    overallScore,
    grade,
    tokenAdoptionScore,
    componentReuseScore,
    cleanlinessScore,
    totalIssues,
    errorsCount: errors,
    warningsCount: warnings,
    summary: `Codebase UI Quality Grade: ${grade} (${overallScore}/100) — ${totalIssues} total issues detected across ${auditReport.auditedFilesCount} files.`,
    recommendations,
  };
}

