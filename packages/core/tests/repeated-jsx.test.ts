import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { auditProject } from "../src/operations/audit";

describe("Repeated Inline JSX Detector", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-repeated-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("detects repeated complex card structures and recommends component extraction", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-repeated-app",
        dependencies: { next: "14.0.0", react: "18.0.0" },
        devDependencies: { tailwindcss: "3.4.0" },
      })
    );

    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });

    // File with 3 repeated monolithic card containers
    writeFileSync(
      path.join(tempDir, "src", "app", "projects-list.tsx"),
      `
      export default function ProjectsList() {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 rounded-xl border bg-white shadow-sm">
              <h3 className="font-bold">Project Alpha</h3>
              <p>Description 1</p>
            </div>

            <div className="flex items-center justify-between p-6 rounded-xl border bg-white shadow-sm">
              <h3 className="font-bold">Project Beta</h3>
              <p>Description 2</p>
            </div>

            <div className="flex items-center justify-between p-6 rounded-xl border bg-white shadow-sm">
              <h3 className="font-bold">Project Gamma</h3>
              <p>Description 3</p>
            </div>
          </div>
        );
      }
      `
    );

    const report = auditProject({ rootDir: tempDir });

    const repeatedIssue = report.issues.find((i) => i.ruleId === "no-repeated-inline-jsx");
    expect(repeatedIssue).toBeDefined();
    expect(repeatedIssue?.message).toContain("Repeated inline JSX structure found (3 times");
    expect(repeatedIssue?.suggestedFix?.description).toContain("components/ProjectCard.tsx");
  });
});
