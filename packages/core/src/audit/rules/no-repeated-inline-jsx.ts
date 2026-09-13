import ts from "typescript";
import * as path from "node:path";
import type { AuditIssue } from "../../types";

interface JsxPatternOccurrence {
  node: ts.Node;
  tag: string;
  className: string;
  line: number;
  column: number;
  snippet: string;
}

function deriveSuggestedComponentName(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  // Clean up e.g. 'projects-list' -> 'ProjectCard' or 'ProjectItem'
  const singular = base.replace(/s(-list)?$/i, "").replace(/-list$/i, "");
  const pascal = singular
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  return pascal ? `${pascal}Card` : "CustomCard";
}

export function checkRepeatedInlineJsx(
  sourceFile: ts.SourceFile,
  filePath: string
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const patternMap = new Map<string, JsxPatternOccurrence[]>();

  function normalizeClassName(className: string): string {
    return className
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(" ");
  }

  function getClassNameValue(node: ts.JsxElement | ts.JsxSelfClosingElement): string | null {
    const attributes = ts.isJsxElement(node)
      ? node.openingElement.attributes
      : node.attributes;

    for (const prop of attributes.properties) {
      if (ts.isJsxAttribute(prop) && prop.name.getText(sourceFile) === "className") {
        if (prop.initializer && ts.isStringLiteral(prop.initializer)) {
          return prop.initializer.text;
        }
      }
    }
    return null;
  }

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = ts.isJsxElement(node)
        ? node.openingElement.tagName.getText(sourceFile)
        : node.tagName.getText(sourceFile);

      const className = getClassNameValue(node);

      // Only track elements with at least 3 classes (complex styled containers / cards / items)
      if (className && className.split(/\s+/).filter(Boolean).length >= 3) {
        const normalized = `${tagName}::${normalizeClassName(className)}`;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        const snippet = ts.isJsxElement(node)
          ? node.openingElement.getText(sourceFile)
          : node.getText(sourceFile);

        const list = patternMap.get(normalized) || [];
        list.push({
          node,
          tag: tagName,
          className,
          line: line + 1,
          column: character + 1,
          snippet,
        });
        patternMap.set(normalized, list);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Analyze repetitions (2 or more identical complex elements)
  const suggestedCompName = deriveSuggestedComponentName(filePath);

  for (const [fingerprint, occurrences] of patternMap.entries()) {
    if (occurrences.length >= 2) {
      const first = occurrences[0];
      const count = occurrences.length;

      const lines = occurrences.map((o) => `line ${o.line}`).join(", ");
      const message = `Repeated inline JSX structure found (${count} times across ${lines}). Extract into a reusable <${suggestedCompName}> component.`;

      issues.push({
        id: `repeated-jsx-${filePath}-${first.line}-${first.column}`,
        ruleId: "no-repeated-inline-jsx",
        category: "repeated-inline-jsx",
        severity: "warning",
        message,
        location: {
          filePath,
          line: first.line,
          column: first.column,
        },
        snippet: first.snippet,
        suggestedFix: {
          description: `Extract repeated JSX pattern into 'components/${suggestedCompName}.tsx' and pass data via props`,
          replacementText: `<${suggestedCompName} ... />`,
          confidence: "high",
          isAutoFixable: false,
        },
        confidence: "high",
      });
    }
  }

  return issues;
}
