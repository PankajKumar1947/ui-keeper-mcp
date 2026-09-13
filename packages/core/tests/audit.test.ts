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

    // Page with violations:
    // 1. Hardcoded arbitrary color bg-[#1e293b]
    // 2. Arbitrary spacing p-[18px]
    // 3. Duplicate inline <button className="...">
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

    // Check duplicate component issue
    const duplicateIssue = report.issues.find((i) => i.ruleId === "no-duplicate-components");
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.message).toContain("Button");
  });
});
