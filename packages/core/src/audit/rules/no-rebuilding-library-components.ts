import ts from "typescript";
import type { AuditIssue } from "../../types";
import type { InstalledLibraryInfo } from "../../extractor/library-detector";

export function checkRebuildingLibraryComponents(
  sourceFile: ts.SourceFile,
  filePath: string,
  libInfo: InstalledLibraryInfo
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if (!libInfo.hasShadcn && !libInfo.hasRadix) return issues;
  if (filePath.includes("components/ui/")) return issues; // Don't flag component definitions

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attributes = ts.isJsxElement(node)
        ? node.openingElement.attributes
        : node.attributes;

      let className = "";
      for (const p of attributes.properties) {
        if (ts.isJsxAttribute(p) && p.name.getText(sourceFile) === "className" && p.initializer && ts.isStringLiteral(p.initializer)) {
          className = p.initializer.text;
        }
      }

      // Check for inline modal/dialog backdrop patterns (fixed inset-0 bg-black/50 or z-50 backdrop-blur)
      if (/fixed\s+inset-0/.test(className) && /bg-black|backdrop-blur|z-50/.test(className)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const hasDialog = libInfo.shadcnComponents.includes("dialog");
        const suggestion = hasDialog
          ? "Use existing '@components/ui/dialog' component instead of coding an inline modal"
          : "Add and use standard dialog: 'npx shadcn@latest add dialog'";

        issues.push({
          id: `rebuilding-dialog-${filePath}-${line}-${character}`,
          ruleId: "no-rebuilding-library-components",
          category: "duplicate-component",
          severity: "warning",
          message: `Custom modal backdrop coded inline. ${suggestion}.`,
          location: {
            filePath,
            line: line + 1,
            column: character + 1,
          },
          snippet: `<div className="${className.slice(0, 40)}...">`,
          suggestedFix: {
            description: suggestion,
            confidence: "high",
            isAutoFixable: false,
          },
          confidence: "high",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}
