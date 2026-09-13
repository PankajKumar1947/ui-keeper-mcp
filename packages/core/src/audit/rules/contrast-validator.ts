import ts from "typescript";
import type { AuditIssue, DesignSystem } from "../../types";
import { calculateContrastRatio, isWcagCompliant } from "../../utils/contrast";

const KNOWN_COLORS: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
  "slate-50": "#f8fafc",
  "slate-100": "#f1f5f9",
  "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",
  "slate-950": "#020617",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
  "red-500": "#ef4444",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "green-500": "#22c55e",
  "amber-500": "#f59e0b",
};

export function checkColorContrast(
  sourceFile: ts.SourceFile,
  filePath: string,
  designSystem: DesignSystem
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Build color lookup map from design system + standard colors
  const colorMap = new Map<string, string>();
  for (const [name, hex] of Object.entries(KNOWN_COLORS)) colorMap.set(name, hex);
  for (const token of designSystem.colors) {
    if (token.hex) colorMap.set(token.name, token.hex);
  }

  function resolveColorHex(colorNameOrRaw: string): string | null {
    if (colorNameOrRaw.startsWith("#")) return colorNameOrRaw;
    return colorMap.get(colorNameOrRaw) || null;
  }

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text;

      // Extract text and bg colors from same className string
      const textMatch = text.match(/\btext-(slate-[0-9]+|gray-[0-9]+|zinc-[0-9]+|neutral-[0-9]+|stone-[0-9]+|red-[0-9]+|blue-[0-9]+|white|black|\[#[0-9a-fA-F]+\])\b/);
      const bgMatch = text.match(/\bbg-(slate-[0-9]+|gray-[0-9]+|zinc-[0-9]+|neutral-[0-9]+|stone-[0-9]+|red-[0-9]+|blue-[0-9]+|white|black|\[#[0-9a-fA-F]+\])\b/);

      if (textMatch && bgMatch) {
        const textColorRaw = textMatch[1].replace(/^\[|\]$/g, "");
        const bgColorRaw = bgMatch[1].replace(/^\[|\]$/g, "");

        const textHex = resolveColorHex(textColorRaw);
        const bgHex = resolveColorHex(bgColorRaw);

        if (textHex && bgHex) {
          const ratio = calculateContrastRatio(textHex, bgHex);
          if (ratio !== null && !isWcagCompliant(ratio, false, "AA")) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

            issues.push({
              id: `contrast-violation-${filePath}-${line}-${character}`,
              ruleId: "wcag-contrast-ratio",
              category: "contrast-violation",
              severity: "error",
              message: `Insufficient color contrast ratio (${ratio}:1) between text '${textMatch[0]}' and background '${bgMatch[0]}'. WCAG AA requires at least 4.5:1 for body text.`,
              location: {
                filePath,
                line: line + 1,
                column: character + 1,
              },
              snippet: `${textMatch[0]} ${bgMatch[0]}`,
              suggestedFix: {
                description: `Increase contrast ratio to >= 4.5:1 by adjusting text or background shade`,
                confidence: "high",
                isAutoFixable: false,
              },
              confidence: "high",
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}
