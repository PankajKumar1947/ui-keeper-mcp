import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { analyzeProject } from "../src/operations/analyze";

describe("Analyze Project Operation", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-analyze-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("runs full project analysis producing validated ProjectModel", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "ecommerce-web",
        dependencies: { next: "14.2.0", react: "18.3.0" },
        devDependencies: { tailwindcss: "3.4.1" },
      })
    );

    mkdirSync(path.join(tempDir, "src", "components", "ui"), { recursive: true });
    mkdirSync(path.join(tempDir, "src", "app", "checkout"), { recursive: true });

    writeFileSync(
      path.join(tempDir, "src", "app", "globals.css"),
      `:root {
        --primary: #3b82f6;
        --radius: 0.5rem;
      }`
    );

    writeFileSync(
      path.join(tempDir, "src", "components", "ui", "badge.tsx"),
      `export function Badge({ label }: { label: string }) { return <span>{label}</span>; }`
    );

    writeFileSync(
      path.join(tempDir, "src", "app", "page.tsx"),
      `export default function HomePage() { return <div>Home</div>; }`
    );

    writeFileSync(
      path.join(tempDir, "src", "app", "checkout", "page.tsx"),
      `export default function CheckoutPage() { return <div>Checkout</div>; }`
    );

    const model = analyzeProject({ rootDir: tempDir });

    expect(model.config.framework).toBe("nextjs");
    expect(model.config.stylingEngine).toBe("tailwind");
    expect(model.designSystem.colors.length).toBeGreaterThan(0);
    expect(model.componentCatalog.totalCount).toBe(1);
    expect(model.componentCatalog.components[0].name).toBe("Badge");
    expect(model.routes).toHaveLength(2);
  });
});
