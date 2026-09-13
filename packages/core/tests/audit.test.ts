import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { auditProject } from "../src/operations/audit";

describe("Static UI Audit Engine", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-audit-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("detects hardcoded colors, arbitrary spacing, and duplicate components", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-audit-app",
        dependencies: { next: "14.0.0", react: "18.0.0" },
        devDependencies: { tailwindcss: "3.4.0" },
      })
    );

    mkdirSync(path.join(tempDir, "src", "components", "ui"), { recursive: true });
    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });

    // Design system button component
    writeFileSync(
      path.join(tempDir, "src", "components", "ui", "button.tsx"),
      `export function Button({ children }: { children: React.ReactNode }) { return <button>{children}</button>; }`
    );

    writeFileSync(
      path.join(tempDir, "src", "app", "page.tsx"),
      `
      export default function Page() {
        return (
          <div className="bg-[#1e293b] p-[18px]">
            <h1 className="text-xl">Header</h1>
            <button className="bg-blue-500 text-white px-4 py-2">Click Me</button>
          </div>
        );
      }
      `
    );

    const report = auditProject({ rootDir: tempDir });

    expect(report.totalIssues).toBeGreaterThanOrEqual(3);

    // Check hardcoded color issue
    const colorIssue = report.issues.find((i) => i.ruleId === "no-hardcoded-colors");
    expect(colorIssue).toBeDefined();
    expect(colorIssue?.snippet).toContain("bg-[#1e293b]");
    expect(colorIssue?.suggestedFix?.replacementText).toBe("bg-slate-800");

    // Check arbitrary spacing issue
    const spacingIssue = report.issues.find((i) => i.ruleId === "no-arbitrary-spacing");
    expect(spacingIssue).toBeDefined();
    expect(spacingIssue?.snippet).toContain("p-[18px]");
    expect(spacingIssue?.message).toContain("not divisible by 4px base grid");

    // Check duplicate component issue
    const duplicateIssue = report.issues.find((i) => i.ruleId === "no-duplicate-components");
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.message).toContain("Button");
  });

  test("handles 4px grid edge cases, rem units, font sizes, and radii", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-edge-cases",
        dependencies: { next: "14.0.0" },
        devDependencies: { tailwindcss: "3.4.0" },
      })
    );

    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });

    writeFileSync(
      path.join(tempDir, "src", "app", "card.tsx"),
      `
      export function Card() {
        return (
          <div className="gap-[24px] p-[1.5rem] rounded-[8px] text-[14px] -m-[16px]">
            <span>Content</span>
          </div>
        );
      }
      `
    );

    const report = auditProject({ rootDir: tempDir });

    // 1. gap-[24px] -> gap-6 (exact 4px multiple in brackets)
    const gapIssue = report.issues.find((i) => i.snippet === "gap-[24px]");
    expect(gapIssue).toBeDefined();
    expect(gapIssue?.suggestedFix?.replacementText).toBe("gap-6");

    // 2. p-[1.5rem] -> p-6 (rem conversion: 1.5 * 16 = 24px)
    const remIssue = report.issues.find((i) => i.snippet === "p-[1.5rem]");
    expect(remIssue).toBeDefined();
    expect(remIssue?.suggestedFix?.replacementText).toBe("p-6");

    // 3. rounded-[8px] -> rounded-lg
    const radiusIssue = report.issues.find((i) => i.snippet === "rounded-[8px]");
    expect(radiusIssue).toBeDefined();
    expect(radiusIssue?.suggestedFix?.replacementText).toBe("rounded-lg");

    // 4. text-[14px] -> text-sm
    const fontIssue = report.issues.find((i) => i.snippet === "text-[14px]");
    expect(fontIssue).toBeDefined();
    expect(fontIssue?.suggestedFix?.replacementText).toBe("text-sm");

    // 5. -m-[16px] -> -m-4 (negative margin)
    const negIssue = report.issues.find((i) => i.snippet === "-m-[16px]");
    expect(negIssue).toBeDefined();
    expect(negIssue?.suggestedFix?.replacementText).toBe("-m-4");
  });
});
