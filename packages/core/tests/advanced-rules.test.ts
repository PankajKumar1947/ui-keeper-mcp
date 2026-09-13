import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { auditProject } from "../src/operations/audit";
import { calculateContrastRatio, isWcagCompliant } from "../src/utils/contrast";

describe("Advanced Audit Rules & Contrast", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-advanced-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("calculates WCAG contrast ratio accurately", () => {
    // White on Black: 21:1 (Max)
    const maxRatio = calculateContrastRatio("#ffffff", "#000000");
    expect(maxRatio).toBe(21);
    expect(isWcagCompliant(maxRatio!)).toBe(true);

    // Light gray (gray-300 #d1d5db) on white #ffffff -> fails AA (~1.48:1)
    const badRatio = calculateContrastRatio("#d1d5db", "#ffffff");
    expect(badRatio).toBeLessThan(3.0);
    expect(isWcagCompliant(badRatio!)).toBe(false);

    // Dark text (gray-800 #1f2937) on white #ffffff -> passes AA (>12:1)
    const goodRatio = calculateContrastRatio("#1f2937", "#ffffff");
    expect(goodRatio).toBeGreaterThan(10);
    expect(isWcagCompliant(goodRatio!)).toBe(true);
  });

  test("detects conflicting Tailwind classes and contrast violations in JSX", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-advanced-app",
        dependencies: { next: "14.0.0" },
        devDependencies: { tailwindcss: "3.4.0" },
      })
    );

    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });

    // File with:
    // 1. Conflicting display (block flex)
    // 2. Conflicting text align (text-left text-center)
    // 3. Bad contrast (text-gray-400 on bg-white)
    writeFileSync(
      path.join(tempDir, "src", "app", "page.tsx"),
      `
      export default function Page() {
        return (
          <div className="block flex text-left text-center">
            <p className="text-gray-400 bg-white">Low contrast paragraph</p>
          </div>
        );
      }
      `
    );

    const report = auditProject({ rootDir: tempDir });

    // Check conflicting display classes
    const displayConflict = report.issues.find(
      (i) => i.ruleId === "no-conflicting-classes" && i.snippet?.includes("block")
    );
    expect(displayConflict).toBeDefined();

    // Check conflicting text alignment classes
    const alignConflict = report.issues.find(
      (i) => i.ruleId === "no-conflicting-classes" && i.snippet?.includes("text-left")
    );
    expect(alignConflict).toBeDefined();

    // Check WCAG contrast violation
    const contrastIssue = report.issues.find((i) => i.ruleId === "wcag-contrast-ratio");
    expect(contrastIssue).toBeDefined();
    expect(contrastIssue?.severity).toBe("error");
    expect(contrastIssue?.message).toContain("Insufficient color contrast ratio");
  });
});
