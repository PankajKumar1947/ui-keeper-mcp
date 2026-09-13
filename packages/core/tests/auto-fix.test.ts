import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fixProject } from "../src/operations/fix";

describe("Auto-Fix Engine & Verification Loop", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-fix-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("auto-fixes arbitrary hardcoded color and verifies issue count reduction", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-fix-app",
        dependencies: { next: "14.0.0", react: "18.0.0" },
        devDependencies: { tailwindcss: "3.4.0" },
      })
    );

    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });

    // File with hardcoded color bg-[#1e293b] (which exactly matches slate-800)
    const pagePath = path.join(tempDir, "src", "app", "page.tsx");
    writeFileSync(
      pagePath,
      `export default function Page() { return <div className="bg-[#1e293b] text-white">Hello</div>; }`
    );

    const result = fixProject({ rootDir: tempDir });

    expect(result.totalFixed).toBe(1);
    expect(result.remainingIssues).toBe(0);

    const updatedContent = readFileSync(pagePath, "utf-8");
    expect(updatedContent).toContain("bg-slate-800");
    expect(updatedContent).not.toContain("bg-[#1e293b]");
  });
});
