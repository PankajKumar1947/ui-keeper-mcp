import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { generateComponent } from "../src/operations/generate";
import { calculateHealthScore } from "../src/operations/score";

describe("Component Generator & Health Score", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-gen-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("generates and writes a typed Card component", () => {
    const result = generateComponent({
      rootDir: tempDir,
      name: "ProjectCard",
      category: "card",
      writeToFile: true,
    });

    expect(result.componentName).toBe("ProjectCard");
    expect(result.code).toContain("export function ProjectCard");
    expect(result.code).toContain("ProjectCardProps");
    expect(result.savedPath).toBeDefined();
    expect(existsSync(result.savedPath!)).toBe(true);
  });

  test("calculates health score and recommendations correctly", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-clean-app",
        dependencies: { next: "14.0.0" },
        devDependencies: { tailwindcss: "3.4.0" },
      })
    );

    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });

    // Clean file adhering to design tokens
    writeFileSync(
      path.join(tempDir, "src", "app", "page.tsx"),
      `export default function Page() { return <div className="p-4 bg-slate-900 text-white">Clean</div>; }`
    );

    const score = calculateHealthScore({ rootDir: tempDir });

    expect(score.overallScore).toBeGreaterThanOrEqual(95);
    expect(["A+", "A"]).toContain(score.grade);
    expect(score.totalIssues).toBe(0);
  });
});
