import ts from "typescript";
import type { AuditIssue } from "../../types";

interface ClassToken {
  raw: string;
  variant: string; // e.g. "hover", "dark", "md", ""
  utility: string; // e.g. "bg-red-500", "p-4"
  group: string;   // e.g. "bg-color", "display", "text-align"
}

function parseTailwindToken(className: string): ClassToken {
  const parts = className.split(":");
  const utility = parts.pop() || "";
  const variant = parts.sort().join(":");

  let group = "other";

  // 1. Display
  if (/^(block|inline-block|inline|flex|inline-flex|table|inline-table|grid|inline-grid|contents|list-item|hidden)$/.test(utility)) {
    group = "display";
  }
  // 2. Position
  else if (/^(static|fixed|absolute|relative|sticky)$/.test(utility)) {
    group = "position";
  }
  // 3. Text Alignment
  else if (/^text-(left|center|right|justify|start|end)$/.test(utility)) {
    group = "text-align";
  }
  // 4. Background Color
  else if (/^bg-(?!opacity|auto|cover|contain|bottom|top|center|left|right|fixed|local|scroll|clip|origin|repeat|no-repeat)/.test(utility)) {
    group = "bg-color";
  }
  // 5. Text Color
  else if (/^text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent|current|inherit)/.test(utility) || /^text-\[#/.test(utility)) {
    group = "text-color";
  }
  // 6. Text Size
  else if (/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/.test(utility)) {
    group = "text-size";
  }
  // 7. Font Weight
  else if (/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(utility)) {
    group = "font-weight";
  }
  // 8. Text Decoration
  else if (/^(underline|overline|line-through|no-underline)$/.test(utility)) {
    group = "text-decoration";
  }
  // 9. Overflow
  else if (/^overflow-(auto|hidden|clip|visible|scroll|x-auto|x-hidden|x-clip|x-visible|x-scroll|y-auto|y-hidden|y-clip|y-visible|y-scroll)$/.test(utility)) {
    group = "overflow";
  }
  // 10. Justify Content
  else if (/^justify-(normal|start|end|center|between|around|evenly|stretch)$/.test(utility)) {
    group = "justify-content";
  }
  // 11. Align Items
  else if (/^items-(start|end|center|baseline|stretch)$/.test(utility)) {
    group = "align-items";
  }
  // 12. Flex Direction
  else if (/^flex-(row|row-reverse|col|col-reverse)$/.test(utility)) {
    group = "flex-direction";
  }

  return { raw: className, variant, utility, group };
}

export function checkConflictingClasses(
  sourceFile: ts.SourceFile,
  filePath: string
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.text.trim();
      const classes = text.split(/\s+/).filter(Boolean);

      if (classes.length >= 2) {
        const tokens = classes.map(parseTailwindToken);
        const groupMap = new Map<string, ClassToken[]>();

        for (const token of tokens) {
          if (token.group === "other") continue;
          const key = `${token.variant}::${token.group}`;
          const list = groupMap.get(key) || [];
          list.push(token);
          groupMap.set(key, list);
        }

        // Check for conflicts
        for (const [key, list] of groupMap.entries()) {
          if (list.length >= 2) {
            const [variant, group] = key.split("::");
            const conflictClasses = list.map((t) => t.raw);
            const winner = list[list.length - 1].raw; // in CSS, last class generally overrides
            const redundant = list.slice(0, -1).map((t) => t.raw);

            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const message = `Conflicting Tailwind classes '${conflictClasses.join(" ")}' on '${group}'. '${redundant.join(", ")}' is redundant and overridden by '${winner}'`;

            // Auto-fix: remove redundant class from string
            const cleanedClasses = classes.filter((c) => !redundant.includes(c));
            const replacementText = cleanedClasses.join(" ");

            issues.push({
              id: `class-conflict-${filePath}-${line}-${character}-${group}`,
              ruleId: "no-conflicting-classes",
              category: "design-system-drift",
              severity: "warning",
              message,
              location: {
                filePath,
                line: line + 1,
                column: character + 1,
              },
              snippet: conflictClasses.join(" "),
              suggestedFix: {
                description: `Remove redundant class '${redundant.join(", ")}' (keep '${winner}')`,
                replacementText,
                confidence: "high",
                isAutoFixable: true,
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
