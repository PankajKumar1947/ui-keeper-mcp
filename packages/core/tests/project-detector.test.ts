import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { detectProject } from "../src/extractor/project-detector";

describe("Project Detector", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("detects Next.js project with Tailwind CSS and App router", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-next-app",
        dependencies: {
          next: "^14.0.0",
          react: "^18.0.0",
          "react-dom": "^18.0.0",
        },
        devDependencies: {
          tailwindcss: "^3.4.0",
        },
      })
    );

    writeFileSync(path.join(tempDir, "tailwind.config.ts"), "export default {};");
    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });
    mkdirSync(path.join(tempDir, "src", "components", "ui"), { recursive: true });
    writeFileSync(path.join(tempDir, "src", "app", "globals.css"), ":root {}");

    const config = detectProject(tempDir);

    expect(config.framework).toBe("nextjs");
    expect(config.stylingEngine).toBe("tailwind");
    expect(config.srcDir).toBe("src");
    expect(config.componentsDir).toBe("src/components");
    expect(config.routesDir).toBe("src/app");
    expect(config.tailwindConfigPath).toBe("tailwind.config.ts");
    expect(config.globalCssPaths).toContain("src/app/globals.css");
  });

  test("detects Vite React project", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-vite-app",
        dependencies: {
          react: "^18.0.0",
        },
        devDependencies: {
          vite: "^5.0.0",
        },
      })
    );

    mkdirSync(path.join(tempDir, "src"), { recursive: true });
    writeFileSync(path.join(tempDir, "src", "index.css"), "body {}");

    const config = detectProject(tempDir);

    expect(config.framework).toBe("vite");
    expect(config.stylingEngine).toBe("vanilla-css");
    expect(config.srcDir).toBe("src");
    expect(config.globalCssPaths).toContain("src/index.css");
  });
});
