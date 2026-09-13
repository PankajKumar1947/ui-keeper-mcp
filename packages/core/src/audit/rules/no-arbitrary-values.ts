import ts from "typescript";
import type { AuditIssue, DesignSystem } from "../../types";

export function checkArbitraryValues(
  sourceFile: ts.SourceFile,
  filePath: string,
  designSystem: DesignSystem
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  function findClosestSpacing(px: number) {
    let closest: { name: string; pxValue: number; diff: number } | null = null;
    for (const token of designSystem.spacing) {
      const diff = Math.abs(token.pxValue - px);
      if (!closest || diff < closest.diff) {
        closest = { name: token.name, pxValue: token.pxValue, diff };
      }
    }
    return closest;
  }

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text;

      // Match arbitrary spacing/sizing like p-[18px], m-[13px], gap-[22px], w-[350px], h-[45px]
      const arbitrarySpacingMatch = text.matchAll(/\b(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|gap|w|h)-\[([0-9.]+)px\]/g);
      for (const match of arbitrarySpacingMatch) {
        const prefix = match[1];
        const pxVal = parseFloat(match[2]);
        const closest = findClosestSpacing(pxVal);

        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        let message = `Arbitrary spacing value '${match[0]}' found`;
        let suggestedText: string | undefined;

        if (closest && closest.diff <= 4) {
          suggestedText = `${prefix}-${closest.name}`;
          message += `. Nearest scale token is '${suggestedText}' (${closest.pxValue}px)`;
        }

        issues.push({
          id: `arbitrary-spacing-${filePath}-${line}-${character}`,
          ruleId: "no-arbitrary-spacing",
          category: "arbitrary-value",
          severity: "warning",
          message,
          location: {
            filePath,
            line: line + 1,
            column: character + 1,
          },
          snippet: match[0],
          suggestedFix: suggestedText
            ? {
                description: `Replace with '${suggestedText}'`,
                replacementText: suggestedText,
                confidence: closest && closest.diff === 0 ? "high" : "medium",
                isAutoFixable: closest ? closest.diff === 0 : false,
              }
            : undefined,
          confidence: closest && closest.diff <= 2 ? "high" : "medium",
        });
      }

      // Match arbitrary radius like rounded-[7px]
      const arbitraryRadiusMatch = text.matchAll(/\brounded-\[([0-9.]+)px\]/g);
      for (const match of arbitraryRadiusMatch) {
        const pxVal = parseFloat(match[1]);
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        issues.push({
          id: `arbitrary-radius-${filePath}-${line}-${character}`,
          ruleId: "no-arbitrary-radius",
          category: "arbitrary-value",
          severity: "warning",
          message: `Arbitrary border radius '${match[0]}' found`,
          location: {
            filePath,
            line: line + 1,
            column: character + 1,
          },
          snippet: match[0],
          confidence: "medium",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}
