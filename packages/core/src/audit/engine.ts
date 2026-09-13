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
  const target = options.targetPath
    ? path.isAbsolute(options.targetPath)
      ? options.targetPath
      : path.join(rootDir, options.targetPath)
    : rootDir;

  const targetExists = existsSync(target);
  if (!targetExists) {
    const relDisplay = options.targetPath || ".";
    return {
      timestamp: new Date().toISOString(),
      targetPath: relDisplay,
      totalIssues: 0,
      errorsCount: 0,
      warningsCount: 0,
      auditedFilesCount: 0,
      issues: [],
      summary: `Target path does not exist: '${relDisplay}'.`,
      error: `Target path not found: '${relDisplay}'.`,
    };
  }

  const libInfo = detectInstalledLibraries(rootDir);
  const files = findSourceFiles(target);

  if (files.length === 0) {
    const relDisplay = options.targetPath || ".";
    return {
      timestamp: new Date().toISOString(),
      targetPath: relDisplay,
      totalIssues: 0,
      errorsCount: 0,
      warningsCount: 0,
      auditedFilesCount: 0,
      issues: [],
      summary: `No matching source files (.tsx, .jsx, .ts, .js) found in '${relDisplay}'.`,
      error: `No source files found to audit in '${relDisplay}'.`,
    };
  }

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
    targetPath: options.targetPath || (path.relative(rootDir, target) || "."),
    totalIssues: issues.length,
    errorsCount,
    warningsCount,
    auditedFilesCount: files.length,
    issues,
    summary: `Found ${issues.length} issues (${errorsCount} errors, ${warningsCount} warnings) across ${files.length} audited files.`,
  };
}

export interface AuditCodeContentOptions {
  code: string;
  filePath?: string;
  cssContent?: string;
  designSystem?: import("../types").DesignSystem;
}

export function auditCodeContent(options: AuditCodeContentOptions): AuditReport {
  const filePath = options.filePath || "Component.tsx";
  const isTsx = filePath.endsWith(".tsx") || filePath.endsWith(".ts");
  const sourceFile = ts.createSourceFile(
    filePath,
    options.code,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
  );

  let designSystem = options.designSystem;
  if (!designSystem) {
    const { parseCssContent } = require("../extractor/css-variable-parser");
    const {
      DEFAULT_TAILWIND_COLORS,
      DEFAULT_TAILWIND_SPACING,
      DEFAULT_TAILWIND_RADIUS,
      DEFAULT_TAILWIND_SHADOWS,
      DEFAULT_TAILWIND_BREAKPOINTS,
    } = require("../extractor/tailwind-parser");

    const cssVars = options.cssContent
      ? parseCssContent(options.cssContent)
      : { colors: [], spacing: [], radius: [], shadows: [], typography: [] };

    const colorsMap = new Map<string, any>();
    for (const c of DEFAULT_TAILWIND_COLORS) colorsMap.set(c.name, c);
    for (const c of cssVars.colors) colorsMap.set(c.name, c);

    const spacingMap = new Map<string, any>();
    for (const s of DEFAULT_TAILWIND_SPACING) spacingMap.set(s.name, s);
    for (const s of cssVars.spacing) spacingMap.set(s.name, s);

    const radiusMap = new Map<string, any>();
    for (const r of DEFAULT_TAILWIND_RADIUS) radiusMap.set(r.name, r);
    for (const r of cssVars.radius) radiusMap.set(r.name, r);

    designSystem = {
      version: "1.0.0",
      framework: "react",
      stylingEngine: "tailwind",
      colors: Array.from(colorsMap.values()),
      spacing: Array.from(spacingMap.values()),
      typography: cssVars.typography,
      radius: Array.from(radiusMap.values()),
      shadows: Array.from(DEFAULT_TAILWIND_SHADOWS),
      breakpoints: Array.from(DEFAULT_TAILWIND_BREAKPOINTS),
    };
  }

  const issues: AuditIssue[] = [];
  issues.push(...checkHardcodedColors(sourceFile, filePath, designSystem));
  issues.push(...checkArbitraryValues(sourceFile, filePath, designSystem));
  issues.push(...checkDuplicateComponents(sourceFile, filePath, { components: [], totalCount: 0, categories: {} }));
  issues.push(...checkRepeatedInlineJsx(sourceFile, filePath));
  issues.push(...checkConflictingClasses(sourceFile, filePath));
  issues.push(...checkColorContrast(sourceFile, filePath, designSystem));
  issues.push(...checkRebuildingLibraryComponents(sourceFile, filePath, { hasShadcn: false, hasRadix: false, installedUiComponents: [] }));

  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;

  return {
    timestamp: new Date().toISOString(),
    targetPath: filePath,
    totalIssues: issues.length,
    errorsCount,
    warningsCount,
    auditedFilesCount: 1,
    issues,
    summary: `Found ${issues.length} issues (${errorsCount} errors, ${warningsCount} warnings) in ${filePath}.`,
  };
}


