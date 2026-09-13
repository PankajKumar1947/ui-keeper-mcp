import ts from "typescript";
import type { AuditIssue, DesignSystem } from "../../types";
import { parseHex, colorDistance } from "../../utils/color";

export function checkHardcodedColors(
  sourceFile: ts.SourceFile,
  filePath: string,
  designSystem: DesignSystem
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  function findBestMatchingToken(colorVal: string) {
    let closestToken: { name: string; hex?: string; distance: number } | null = null;

    for (const token of designSystem.colors) {
      if (!token.hex) continue;
      const dist = colorDistance(colorVal, token.hex);
      if (dist !== null) {
        if (!closestToken || dist < closestToken.distance) {
          closestToken = { name: token.name, hex: token.hex, distance: dist };
        }
      }
    }
    return closestToken;
  }

  function visit(node: ts.Node) {
    // Check String Literals e.g. className="bg-[#1e293b]" or style={{ color: "#1e293b" }}
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text;

      // 1. Check arbitrary tailwind color e.g. bg-[#1e293b], text-[#000]
      const arbitraryTwColorMatch = text.matchAll(/\b(bg|text|border|ring|fill|stroke)-\[((?:#|rgb|hsl)[^\]]+)\]/g);
      for (const match of arbitraryTwColorMatch) {
        const prefix = match[1];
        const rawColor = match[2];
        const hex = parseHex(rawColor);

        if (hex) {
          const matchToken = findBestMatchingToken(rawColor);
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

          let suggestedText: string | undefined;
          let message = `Hardcoded color '${rawColor}' used in '${match[0]}'`;

          if (matchToken) {
            suggestedText = `${prefix}-${matchToken.name}`;
            message += `. Nearest token is '${matchToken.name}' (${matchToken.hex})`;
          }

          issues.push({
            id: `hardcoded-color-${filePath}-${line}-${character}`,
            ruleId: "no-hardcoded-colors",
            category: "design-system-drift",
            severity: matchToken && matchToken.distance === 0 ? "warning" : "warning",
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
                  confidence: matchToken && matchToken.distance === 0 ? "high" : "medium",
                  isAutoFixable: matchToken ? matchToken.distance < 15 : false,
                }
              : undefined,
            confidence: matchToken && matchToken.distance === 0 ? "high" : "medium",
          });
        }
      }

      // 2. Check inline style or raw string hex e.g. "#1e293b"
      const rawHexMatch = text.matchAll(/(#[0-9a-fA-F]{3,8})\b/g);
      for (const match of rawHexMatch) {
        const rawColor = match[1];
        // If it's already part of an arbitrary tailwind class, avoid double flagging
        if (text.includes(`-[${rawColor}]`)) continue;

        const matchToken = findBestMatchingToken(rawColor);
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        let message = `Hardcoded hex color '${rawColor}' found`;
        if (matchToken) {
          message += `. Nearest token is '${matchToken.name}'`;
        }

        issues.push({
          id: `hardcoded-color-${filePath}-${line}-${character}`,
          ruleId: "no-hardcoded-colors",
          category: "design-system-drift",
          severity: "warning",
          message,
          location: {
            filePath,
            line: line + 1,
            column: character + 1,
          },
          snippet: rawColor,
          suggestedFix: matchToken
            ? {
                description: `Use token '${matchToken.name}'`,
                replacementText: matchToken.name,
                confidence: matchToken.distance === 0 ? "high" : "medium",
                isAutoFixable: false,
              }
            : undefined,
          confidence: matchToken && matchToken.distance === 0 ? "high" : "medium",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}
