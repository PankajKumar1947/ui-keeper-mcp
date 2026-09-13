import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import * as path from "node:path";
import ts from "typescript";
import type { AuditIssue, AuditReport, ProjectModel } from "../types";
import { checkHardcodedColors } from "./rules/no-hardcoded-colors";
import { checkArbitraryValues } from "./rules/no-arbitrary-values";
import { checkDuplicateComponents } from "./rules/no-duplicate-components";
import { checkRepeatedInlineJsx } from "./rules/no-repeated-inline-jsx";
import { checkConflictingClasses } from "./rules/no-conflicting-classes";
import { checkColorContrast } from "./rules/contrast-validator";
import { checkRebuildingLibraryComponents } from "./rules/no-rebuilding-library-components";
import { detectInstalledLibraries } from "../extractor/library-detector";

export interface AuditEngineOptions {
  targetPath?: string;
  projectModel: ProjectModel;
}

function findSourceFiles(dirOrFile: string): string[] {
  if (!existsSync(dirOrFile)) return [];
  const stat = statSync(dirOrFile);
  if (!stat.isDirectory()) {
    return [dirOrFile];
  }

  const results: string[] = [];
  const entries = readdirSync(dirOrFile);
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry === "dist" || entry.startsWith(".")) continue;
    const full = path.join(dirOrFile, entry);
    const subStat = statSync(full);
    if (subStat.isDirectory()) {
      results.push(...findSourceFiles(full));
    } else {
      if (/\.(tsx|jsx|ts|js)$/.test(entry) && !entry.includes(".test.") && !entry.includes(".spec.") && !entry.endsWith(".d.ts")) {
        results.push(full);
      }
    }
  }
  return results;
}

export function runAudit(options: AuditEngineOptions): AuditReport {
  const { projectModel } = options;
  const rootDir = projectModel.config.rootDir;
  const target = options.targetPath ? path.resolve(options.targetPath) : rootDir;
  const libInfo = detectInstalledLibraries(rootDir);

  const files = findSourceFiles(target);
  const issues: AuditIssue[] = [];

  for (const file of files) {
    const relPath = path.relative(rootDir, file);
    try {
      const content = readFileSync(file, "utf-8");
      const isTsx = file.endsWith(".tsx") || file.endsWith(".ts");
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
      );

      // Rule 1: Hardcoded Colors
      issues.push(...checkHardcodedColors(sourceFile, relPath, projectModel.designSystem));

      // Rule 2: Arbitrary Values (4px grid, rem, font size, radius)
      issues.push(...checkArbitraryValues(sourceFile, relPath, projectModel.designSystem));

      // Rule 3: Duplicate Components
      issues.push(...checkDuplicateComponents(sourceFile, relPath, projectModel.componentCatalog));

      // Rule 4: Repeated Inline JSX
      issues.push(...checkRepeatedInlineJsx(sourceFile, relPath));

      // Rule 5: Conflicting / Redundant Tailwind Classes
      issues.push(...checkConflictingClasses(sourceFile, relPath));

      // Rule 6: Color Contrast Ratio (WCAG AA/AAA)
      issues.push(...checkColorContrast(sourceFile, relPath, projectModel.designSystem));

      // Rule 7: Rebuilding Library Components
      issues.push(...checkRebuildingLibraryComponents(sourceFile, relPath, libInfo));
    } catch {
      // Continue on file parse errors
    }
  }

  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;

  return {
    timestamp: new Date().toISOString(),
    targetPath: path.relative(rootDir, target) || ".",
    totalIssues: issues.length,
    errorsCount,
    warningsCount,
    issues,
    summary: `Found ${issues.length} issues (${errorsCount} errors, ${warningsCount} warnings) across ${files.length} audited files.`,
  };
}
