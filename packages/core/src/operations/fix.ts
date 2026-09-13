import { readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import type { AuditIssue, AuditReport } from "../types";
import { auditProject } from "./audit";
import { applyAutoFixesToFile } from "../fix/fixer";

export interface FixOptions {
  rootDir?: string;
  targetPath?: string;
}

export interface FixReport {
  timestamp: string;
  totalFixed: number;
  revertedFiles: string[];
  fixedFiles: {
    filePath: string;
    fixes: string[];
  }[];
  remainingIssues: number;
}

export function fixProject(options: FixOptions = {}): FixReport {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd();

  // 1. Initial audit: Detect problems
  const initialAudit = auditProject({ rootDir, targetPath: options.targetPath });
  const issuesByFile = new Map<string, AuditIssue[]>();

  for (const issue of initialAudit.issues) {
    const list = issuesByFile.get(issue.location.filePath) || [];
    list.push(issue);
    issuesByFile.set(issue.location.filePath, list);
  }

  const fixedFilesList: { filePath: string; fixes: string[] }[] = [];
  const revertedFilesList: string[] = [];
  let totalFixedCount = 0;

  for (const [relPath, issues] of issuesByFile.entries()) {
    const fullPath = path.isAbsolute(relPath) ? relPath : path.join(rootDir, relPath);
    const originalContent = readFileSync(fullPath, "utf-8");

    // 2. Apply fixes
    const { content: modifiedContent, appliedIssues } = applyAutoFixesToFile(fullPath, issues);

    if (appliedIssues.length === 0) continue;

    // Write modified content temporarily for verification
    writeFileSync(fullPath, modifiedContent, "utf-8");

    // 3. Verification Loop: Re-audit
    const postAudit = auditProject({ rootDir, targetPath: relPath });
    const originalIssueCount = issues.length;
    const newIssueCount = postAudit.issues.filter((i) => i.location.filePath === relPath).length;

    // 4. Decision: If issues decreased, keep; otherwise revert
    if (newIssueCount < originalIssueCount) {
      fixedFilesList.push({
        filePath: relPath,
        fixes: appliedIssues.map((i) => i.suggestedFix?.description || i.message),
      });
      totalFixedCount += appliedIssues.length;
    } else {
      // Revert file
      writeFileSync(fullPath, originalContent, "utf-8");
      revertedFilesList.push(relPath);
    }
  }

  const finalAudit = auditProject({ rootDir, targetPath: options.targetPath });

  return {
    timestamp: new Date().toISOString(),
    totalFixed: totalFixedCount,
    revertedFiles: revertedFilesList,
    fixedFiles: fixedFilesList,
    remainingIssues: finalAudit.totalIssues,
  };
}
