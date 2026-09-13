import ts from "typescript";
import type { AuditIssue, ComponentCatalog } from "../../types";

export function checkDuplicateComponents(
  sourceFile: ts.SourceFile,
  filePath: string,
  catalog: ComponentCatalog
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Check if this file itself is the component definition file
  const buttonComp = catalog.components.find((c) => c.category === "button" || c.name.toLowerCase().includes("button"));
  const inputComp = catalog.components.find((c) => c.category === "input" || c.name.toLowerCase().includes("input"));

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = ts.isJsxElement(node)
        ? node.openingElement.tagName.getText(sourceFile)
        : node.tagName.getText(sourceFile);

      // Check raw <button> usage when Button component exists
      if (tagName === "button" && buttonComp && !filePath.includes(buttonComp.filePath)) {
        // Check if button has className or styled attributes
        const attributes = ts.isJsxElement(node)
          ? node.openingElement.attributes
          : node.attributes;

        const hasClassName = attributes.properties.some(
          (p) => ts.isJsxAttribute(p) && p.name.getText(sourceFile) === "className"
        );

        if (hasClassName) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            id: `duplicate-button-${filePath}-${line}-${character}`,
            ruleId: "no-duplicate-components",
            category: "duplicate-component",
            severity: "warning",
            message: `Raw <button> with custom styles found. Use existing '${buttonComp.name}' component from '${buttonComp.filePath}' instead.`,
            location: {
              filePath,
              line: line + 1,
              column: character + 1,
            },
            snippet: `<button className="...">`,
            suggestedFix: {
              description: `Replace with <${buttonComp.name}>`,
              replacementText: `<${buttonComp.name}`,
              confidence: "high",
              isAutoFixable: false,
            },
            confidence: "high",
          });
        }
      }

      // Check raw <input> usage when Input component exists
      if (tagName === "input" && inputComp && !filePath.includes(inputComp.filePath)) {
        const attributes = ts.isJsxElement(node)
          ? node.openingElement.attributes
          : node.attributes;

        const hasClassName = attributes.properties.some(
          (p) => ts.isJsxAttribute(p) && p.name.getText(sourceFile) === "className"
        );

        if (hasClassName) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            id: `duplicate-input-${filePath}-${line}-${character}`,
            ruleId: "no-duplicate-components",
            category: "duplicate-component",
            severity: "warning",
            message: `Raw <input> with custom styles found. Use existing '${inputComp.name}' component from '${inputComp.filePath}' instead.`,
            location: {
              filePath,
              line: line + 1,
              column: character + 1,
            },
            snippet: `<input className="...">`,
            suggestedFix: {
              description: `Replace with <${inputComp.name}>`,
              replacementText: `<${inputComp.name}`,
              confidence: "high",
              isAutoFixable: false,
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
