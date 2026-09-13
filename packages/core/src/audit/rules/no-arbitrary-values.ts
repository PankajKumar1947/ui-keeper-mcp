import ts from "typescript";
import type { AuditIssue, DesignSystem } from "../../types";

const STANDARD_FONT_SIZES: Record<number, string> = {
  12: "text-xs",
  14: "text-sm",
  16: "text-base",
  18: "text-lg",
  20: "text-xl",
  24: "text-2xl",
  30: "text-3xl",
  36: "text-4xl",
  48: "text-5xl",
  60: "text-6xl",
  72: "text-7xl",
  96: "text-8xl",
  128: "text-9xl",
};

const STANDARD_RADII: Record<number, string> = {
  0: "rounded-none",
  2: "rounded-sm",
  4: "rounded",
  6: "rounded-md",
  8: "rounded-lg",
  12: "rounded-xl",
  16: "rounded-2xl",
  24: "rounded-3xl",
  9999: "rounded-full",
};

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

  function findClosestRadius(px: number) {
    let closest: { name: string; pxValue: number; diff: number } | null = null;
    for (const token of designSystem.radius) {
      if (token.pxValue === undefined) continue;
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

      // 1. Match arbitrary spacing/sizing e.g. p-[18px], -m-[16px], gap-[1.5rem], w-[32px], max-w-[500px]
      const spacingRegex = /(-)?\b(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|max-w|min-h|max-h|top|bottom|left|right|inset|inset-x|inset-y)-\[([0-9.]+)(px|rem|em)\]/g;
      for (const match of text.matchAll(spacingRegex)) {
        const isNegative = match[1] === "-";
        const prefix = match[2];
        const rawNum = parseFloat(match[3]);
        const unit = match[4];

        const pxVal = unit === "rem" || unit === "em" ? rawNum * 16 : rawNum;
        const closest = findClosestSpacing(pxVal);

        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const isExactMultipleOf4 = pxVal % 4 === 0;

        let message = `Arbitrary spacing '${match[0]}' found`;
        let suggestedText: string | undefined;

        if (closest) {
          const negPrefix = isNegative ? "-" : "";
          suggestedText = `${negPrefix}${prefix}-${closest.name}`;

          if (closest.diff === 0) {
            message = `Redundant arbitrary value '${match[0]}'. Standard token '${suggestedText}' (${closest.pxValue}px) already exists`;
          } else if (!isExactMultipleOf4) {
            message = `Off-grid value '${match[0]}' (${pxVal}px is not divisible by 4px base grid). Nearest standard token is '${suggestedText}' (${closest.pxValue}px)`;
          } else {
            message += `. Nearest scale token is '${suggestedText}' (${closest.pxValue}px)`;
          }
        }

        issues.push({
          id: `arbitrary-spacing-${filePath}-${line}-${character}-${match[0]}`,
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
                description: `Replace '${match[0]}' with '${suggestedText}'`,
                replacementText: suggestedText,
                confidence: closest && closest.diff === 0 ? "high" : "medium",
                isAutoFixable: closest ? closest.diff === 0 : false,
              }
            : undefined,
          confidence: closest && closest.diff === 0 ? "high" : "medium",
        });
      }

      // 2. Match arbitrary border radius e.g. rounded-[8px], rounded-[0.5rem]
      const radiusRegex = /\brounded(-\w+)?-\[([0-9.]+)(px|rem|em)\]/g;
      for (const match of text.matchAll(radiusRegex)) {
        const corner = match[1] || "";
        const rawNum = parseFloat(match[2]);
        const unit = match[3];
        const pxVal = unit === "rem" || unit === "em" ? rawNum * 16 : rawNum;

        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const standardClass = STANDARD_RADII[pxVal];
        const closest = findClosestRadius(pxVal);

        let suggestedText: string | undefined;
        let message = `Arbitrary radius '${match[0]}' found`;

        if (standardClass) {
          const baseName = standardClass.replace("rounded-", "").replace("rounded", "");
          suggestedText = corner ? `rounded${corner}${baseName ? `-${baseName}` : ""}` : standardClass;
          message = `Redundant arbitrary radius '${match[0]}'. Use standard '${suggestedText}' instead`;
        } else if (closest && closest.diff <= 2) {
          const baseName = closest.name === "DEFAULT" ? "" : `-${closest.name}`;
          suggestedText = `rounded${corner}${baseName}`;
          message += `. Nearest standard radius is '${suggestedText}' (${closest.pxValue}px)`;
        }

        issues.push({
          id: `arbitrary-radius-${filePath}-${line}-${character}-${match[0]}`,
          ruleId: "no-arbitrary-radius",
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
                description: `Replace '${match[0]}' with '${suggestedText}'`,
                replacementText: suggestedText,
                confidence: standardClass ? "high" : "medium",
                isAutoFixable: !!standardClass,
              }
            : undefined,
          confidence: standardClass ? "high" : "medium",
        });
      }

      // 3. Match arbitrary font sizes e.g. text-[16px], text-[1.125rem]
      const fontRegex = /\btext-\[([0-9.]+)(px|rem|em)\]/g;
      for (const match of text.matchAll(fontRegex)) {
        const rawNum = parseFloat(match[1]);
        const unit = match[2];
        const pxVal = unit === "rem" || unit === "em" ? rawNum * 16 : rawNum;

        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const standardFont = STANDARD_FONT_SIZES[pxVal];

        if (standardFont) {
          issues.push({
            id: `arbitrary-font-${filePath}-${line}-${character}-${match[0]}`,
            ruleId: "no-arbitrary-font-size",
            category: "arbitrary-value",
            severity: "warning",
            message: `Redundant arbitrary font size '${match[0]}'. Use standard '${standardFont}' instead`,
            location: {
              filePath,
              line: line + 1,
              column: character + 1,
            },
            snippet: match[0],
            suggestedFix: {
              description: `Replace '${match[0]}' with '${standardFont}'`,
              replacementText: standardFont,
              confidence: "high",
              isAutoFixable: true,
            },
            confidence: "high",
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}
