import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import {
  parseHex,
  parseRgbString,
  parseHslString,
  colorDistance,
  rgbToHex,
  hslToRgb,
} from "../src/utils/color";
import { parseCssContent } from "../src/extractor/css-variable-parser";
import { extractTokens } from "../src/extractor/token-extractor";
import { detectProject } from "../src/extractor/project-detector";

describe("Color Utilities", () => {
  test("parses hex colors correctly", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#0f172a")).toEqual({ r: 15, g: 23, b: 42 });
    expect(rgbToHex({ r: 15, g: 23, b: 42 })).toBe("#0f172a");
  });

  test("parses rgb and hsl strings", () => {
    const rgb = parseRgbString("rgb(59, 130, 246)");
    expect(rgb).toEqual({ r: 59, g: 130, b: 246, a: undefined });

    const hsl = parseHslString("hsl(217, 91%, 60%)");
    expect(hsl?.h).toBe(217);
    const convertedRgb = hslToRgb(hsl!);
    expect(convertedRgb.r).toBeGreaterThan(50);
  });

  test("calculates color distance accurately", () => {
    // Identical colors
    expect(colorDistance("#1e293b", "#1e293b")).toBe(0);
    // Near match (slate-800 vs gray-800)
    const dist = colorDistance("#1e293b", "#1f2937");
    expect(dist).toBeLessThan(15);
    // Far match (black vs white)
    expect(colorDistance("#000000", "#ffffff")).toBeGreaterThan(400);
  });
});

describe("Token Extractor", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-tokens-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("parses CSS variables into tokens", () => {
    const css = `
      :root {
        --primary: #3b82f6;
        --radius: 0.5rem;
        --spacing-lg: 24px;
        --font-sans: Inter, sans-serif;
      }
    `;
    const tokens = parseCssContent(css);

    expect(tokens.colors).toHaveLength(1);
    expect(tokens.colors[0].name).toBe("primary");
    expect(tokens.colors[0].hex).toBe("#3b82f6");

    expect(tokens.radius).toHaveLength(1);
    expect(tokens.radius[0].pxValue).toBe(8);

    expect(tokens.spacing).toHaveLength(1);
    expect(tokens.spacing[0].pxValue).toBe(24);

    expect(tokens.typography).toHaveLength(1);
    expect(tokens.typography[0].fontFamily).toContain("Inter");
  });

  test("extracts complete design system from Tailwind + CSS project", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-app",
        dependencies: { next: "14.0.0" },
        devDependencies: { tailwindcss: "3.4.0" },
      })
    );

    writeFileSync(
      path.join(tempDir, "tailwind.config.ts"),
      `
      export default {
        theme: {
          extend: {
            colors: {
              'brand-primary': '#6366f1',
            }
          }
        }
      }
      `
    );

    mkdirSync(path.join(tempDir, "src", "app"), { recursive: true });
    writeFileSync(
      path.join(tempDir, "src", "app", "globals.css"),
      `:root { --background: #ffffff; }`
    );

    const config = detectProject(tempDir);
    const designSystem = extractTokens(config);

    expect(designSystem.framework).toBe("nextjs");
    expect(designSystem.stylingEngine).toBe("tailwind");
    expect(designSystem.colors.some((c) => c.name === "brand-primary")).toBe(true);
    expect(designSystem.colors.some((c) => c.name === "background")).toBe(true);
    expect(designSystem.spacing.length).toBeGreaterThan(10);
    expect(designSystem.radius.length).toBeGreaterThan(3);
  });

  test("dynamically discovers app/token.css and detects Tailwind v4 @import", () => {
    writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "test-v4-app",
        dependencies: { next: "16.3.4", "@tailwindcss/postcss": "^4.0.0" },
      })
    );

    mkdirSync(path.join(tempDir, "app"), { recursive: true });
    writeFileSync(
      path.join(tempDir, "app", "globals.css"),
      `@import "tailwindcss";\n@theme { --font-sans: Inter; }`
    );
    writeFileSync(
      path.join(tempDir, "app", "token.css"),
      `
      :root {
        --primary-500: #00953B;
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        --radius-lg: 8px;
        --font-heading: 'Plus Jakarta Sans', sans-serif;
      }
      `
    );

    const config = detectProject(tempDir);
    expect(config.framework).toBe("nextjs");
    expect(config.stylingEngine).toBe("tailwind");
    expect(config.globalCssPaths).toContain("app/globals.css");
    expect(config.globalCssPaths).toContain("app/token.css");

    const tokens = extractTokens(config);
    const primaryToken = tokens.colors.find((c) => c.name === "primary-500");
    expect(primaryToken).toBeDefined();
    expect(primaryToken?.hex).toBe("#00953B");

    const shadowToken = tokens.shadows.find((s) => s.name === "shadow-md");
    expect(shadowToken).toBeDefined();

    const radiusToken = tokens.radius.find((r) => r.name === "radius-lg");
    expect(radiusToken).toBeDefined();
    expect(radiusToken?.pxValue).toBe(8);
  });
});

