import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import * as path from "node:path";
import ts from "typescript";
import type {
  ComponentCatalog,
  ComponentEntry,
  ComponentProp,
  ComponentCategory,
} from "../types";

function inferCategory(name: string, filePath: string): ComponentCategory {
  const lower = (name + " " + filePath).toLowerCase();
  if (lower.includes("button") || lower.includes("btn")) return "button";
  if (lower.includes("card")) return "card";
  if (lower.includes("input") || lower.includes("textfield") || lower.includes("select") || lower.includes("checkbox") || lower.includes("switch")) return "input";
  if (lower.includes("modal") || lower.includes("dialog") || lower.includes("sheet") || lower.includes("drawer")) return "modal";
  if (lower.includes("nav") || lower.includes("header") || lower.includes("footer") || lower.includes("sidebar") || lower.includes("menu")) return "navigation";
  if (lower.includes("layout") || lower.includes("container") || lower.includes("grid") || lower.includes("section")) return "layout";
  if (lower.includes("badge") || lower.includes("tag") || lower.includes("pill") || lower.includes("chip")) return "badge";
  if (lower.includes("avatar") || lower.includes("profile")) return "avatar";
  if (lower.includes("table") || lower.includes("list") || lower.includes("datatable")) return "table";
  if (lower.includes("alert") || lower.includes("toast") || lower.includes("spinner") || lower.includes("progress")) return "feedback";
  if (lower.includes("text") || lower.includes("heading") || lower.includes("title") || lower.includes("label")) return "typography";
  return "other";
}

function extractPropsFromTypeNode(typeNode: ts.TypeNode, sourceFile: ts.SourceFile): ComponentProp[] {
  const props: ComponentProp[] = [];

  if (ts.isTypeLiteralNode(typeNode)) {
    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const propName = member.name.getText(sourceFile);
        const propType = member.type ? member.type.getText(sourceFile) : "any";
        const isOptional = !!member.questionToken;
        props.push({
          name: propName,
          type: propType,
          required: !isOptional,
        });
      }
    }
  }

  return props;
}

function parseComponentFile(filePath: string, relativePath: string): ComponentEntry[] {
  const content = readFileSync(filePath, "utf-8");
  const isTsx = filePath.endsWith(".tsx") || filePath.endsWith(".ts");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
  );

  const entries: ComponentEntry[] = [];
  const typeMap = new Map<string, ts.TypeNode>();

  // Collect interface / type definitions
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      typeMap.set(node.name.text, ts.factory.createTypeLiteralNode(node.members));
    } else if (ts.isTypeAliasDeclaration(node)) {
      typeMap.set(node.name.text, node.type);
    }
  });

  // Collect exported function components
  ts.forEachChild(sourceFile, (node) => {
    let componentName: string | undefined;
    let isDefaultExport = false;
    let isNamedExport = false;
    let props: ComponentProp[] = [];

    // 1. Function declaration
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      // Capitalized implies React component
      if (/^[A-Z]/.test(name)) {
        componentName = name;
        const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        isDefaultExport = !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
        isNamedExport = isExported && !isDefaultExport;

        // Check props in parameters
        if (node.parameters.length > 0) {
          const firstParam = node.parameters[0];
          if (firstParam.type) {
            if (ts.isTypeReferenceNode(firstParam.type)) {
              const typeName = firstParam.type.typeName.getText(sourceFile);
              const foundType = typeMap.get(typeName);
              if (foundType) {
                props = extractPropsFromTypeNode(foundType, sourceFile);
              }
            } else {
              props = extractPropsFromTypeNode(firstParam.type, sourceFile);
            }
          }
        }
      }
    }

    // 2. Variable Statement (const Button = (...) => ... or const Button: React.FC = ...)
    else if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && /^[A-Z]/.test(decl.name.text)) {
          const name = decl.name.text;
          componentName = name;
          isNamedExport = isExported;

          // Check if React.FC<Props>
          if (decl.type && ts.isTypeReferenceNode(decl.type)) {
            if (decl.type.typeArguments && decl.type.typeArguments.length > 0) {
              const typeArg = decl.type.typeArguments[0];
              if (ts.isTypeReferenceNode(typeArg)) {
                const typeName = typeArg.typeName.getText(sourceFile);
                const foundType = typeMap.get(typeName);
                if (foundType) {
                  props = extractPropsFromTypeNode(foundType, sourceFile);
                }
              } else {
                props = extractPropsFromTypeNode(typeArg, sourceFile);
              }
            }
          }

          // Check arrow function parameter
          if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
            const func = decl.initializer;
            if (func.parameters.length > 0) {
              const firstParam = func.parameters[0];
              if (firstParam.type) {
                if (ts.isTypeReferenceNode(firstParam.type)) {
                  const typeName = firstParam.type.typeName.getText(sourceFile);
                  const foundType = typeMap.get(typeName);
                  if (foundType) {
                    props = extractPropsFromTypeNode(foundType, sourceFile);
                  }
                } else {
                  props = extractPropsFromTypeNode(firstParam.type, sourceFile);
                }
              }
            }
          }
        }
      }
    }

    // 3. Export Default Assignment (export default Button)
    else if (ts.isExportAssignment(node)) {
      const name = node.expression.getText(sourceFile);
      if (/^[A-Z]/.test(name)) {
        const existing = entries.find((e) => e.name === name);
        if (existing) {
          existing.exportType = existing.exportType === "named" ? "both" : "default";
        }
      }
    }

    if (componentName) {
      const id = `${relativePath}#${componentName}`;
      entries.push({
        id,
        name: componentName,
        filePath: relativePath,
        exportType: isDefaultExport ? "default" : isNamedExport ? "named" : "named",
        category: inferCategory(componentName, relativePath),
        props,
        variants: [],
        usageCount: 0,
      });
    }
  });

  return entries;
}

function findFilesRecursively(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const list = readdirSync(dir);
  for (const file of list) {
    if (file === "node_modules" || file === ".next" || file === "dist" || file.startsWith(".")) continue;
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results.push(...findFilesRecursively(fullPath, extensions));
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext) && !file.endsWith(".d.ts") && !file.endsWith(".test.tsx") && !file.endsWith(".spec.tsx")) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export function scanComponents(rootDir: string, componentsDir?: string): ComponentCatalog {
  let searchDirs: string[] = [];

  if (componentsDir && existsSync(path.join(rootDir, componentsDir))) {
    searchDirs.push(path.join(rootDir, componentsDir));
  } else {
    const candidates = [
      "components",
      "src/components",
      "app/components",
      "src/app/components",
      "ui",
      "src/ui",
      "app/ui",
      "src/app/ui",
      "src",
    ];
    for (const c of candidates) {
      const full = path.join(rootDir, c);
      if (existsSync(full) && !searchDirs.includes(full)) {
        searchDirs.push(full);
      }
    }
    if (searchDirs.length === 0 && existsSync(rootDir)) {
      searchDirs.push(rootDir);
    }
  }

  const seenFiles = new Set<string>();
  const componentFiles: string[] = [];

  for (const dir of searchDirs) {
    const files = findFilesRecursively(dir, [".tsx", ".jsx", ".ts", ".js"]);
    for (const f of files) {
      if (!seenFiles.has(f)) {
        seenFiles.add(f);
        componentFiles.push(f);
      }
    }
  }

  const allComponents: ComponentEntry[] = [];
  const categoryCounts: Record<string, number> = {};

  for (const file of componentFiles) {
    const relPath = path.relative(rootDir, file);
    // Ignore route page files in Next.js /app or /pages when scanning component libraries
    if (
      /(^|\/)page\.(tsx|jsx|ts|js)$/.test(relPath) ||
      /(^|\/)layout\.(tsx|jsx|ts|js)$/.test(relPath) ||
      /(^|\/)loading\.(tsx|jsx|ts|js)$/.test(relPath) ||
      /(^|\/)error\.(tsx|jsx|ts|js)$/.test(relPath) ||
      /(^|\/)not-found\.(tsx|jsx|ts|js)$/.test(relPath) ||
      /(^|\/)route\.(tsx|jsx|ts|js)$/.test(relPath)
    ) {
      continue;
    }
    try {
      const components = parseComponentFile(file, relPath);
      for (const comp of components) {
        allComponents.push(comp);
        categoryCounts[comp.category] = (categoryCounts[comp.category] || 0) + 1;
      }
    } catch {
      // Continue parsing other component files
    }
  }

  return {
    components: allComponents,
    totalCount: allComponents.length,
    categories: categoryCounts,
  };
}

