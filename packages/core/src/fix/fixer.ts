import { readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import type { AuditIssue } from "../types";

export interface FixResult {
  filePath: string;
  fixedIssues: AuditIssue[];
  reverted: boolean;
  content: string;
}

export function applyAutoFixesToFile(
  fullPath: string,
  issues: AuditIssue[]
): { content: string; appliedIssues: AuditIssue[] } {
  let content = readFileSync(fullPath, "utf-8");
  const appliedIssues: AuditIssue[] = [];

  // Filter high-confidence auto-fixable issues
  const fixable = issues.filter(
    (i) => i.suggestedFix?.isAutoFixable && i.suggestedFix.replacementText && i.snippet
  );

  for (const issue of fixable) {
    const snippet = issue.snippet!;
    const replacement = issue.suggestedFix!.replacementText!;

    if (content.includes(snippet)) {
      content = content.replace(snippet, replacement);
      appliedIssues.push(issue);
    }
  }

  return { content, appliedIssues };
}
