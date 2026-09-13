import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import * as path from "node:path";
import type { ProjectConfig, FrameworkType, StylingEngine } from "../types";

export interface DetectProjectOptions {
  rootDir?: string;
}

function findCssFiles(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  try {
    const list = readdirSync(dir);
    for (const file of list) {
      if (
        file === "node_modules" ||
        file === ".next" ||
        file === "dist" ||
        file === "build" ||
        file === ".wrangler" ||
        file.startsWith(".")
      ) {
        continue;
      }
      const fullPath = path.join(dir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results.push(...findCssFiles(fullPath, baseDir));
      } else if (file.endsWith(".css")) {
        results.push(path.relative(baseDir, fullPath));
      }
    }
  } catch {
    // Ignore directory read errors
  }
  return results;
}

export function detectProject(rootDir: string = process.cwd()): ProjectConfig {
  const pkgPath = path.join(rootDir, "package.json");
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};

  if (existsSync(pkgPath)) {
    try {
      const pkgContent = JSON.parse(readFileSync(pkgPath, "utf-8"));
      dependencies = pkgContent.dependencies || {};
      devDependencies = pkgContent.devDependencies || {};
    } catch {
      // Ignored if invalid JSON
    }
  }

  const allDeps = { ...devDependencies, ...dependencies };

  // Detect Framework
  let framework: FrameworkType = "unknown";
  if (
    "next" in allDeps ||
    existsSync(path.join(rootDir, "next.config.js")) ||
    existsSync(path.join(rootDir, "next.config.mjs")) ||
    existsSync(path.join(rootDir, "next.config.ts")) ||
    existsSync(path.join(rootDir, "next.config.cjs")) ||
    existsSync(path.join(rootDir, "app/layout.tsx")) ||
    existsSync(path.join(rootDir, "src/app/layout.tsx")) ||
    existsSync(path.join(rootDir, "app/layout.jsx")) ||
    existsSync(path.join(rootDir, "src/app/layout.jsx"))
  ) {
    framework = "nextjs";
  } else if (
    "vite" in allDeps ||
    existsSync(path.join(rootDir, "vite.config.js")) ||
    existsSync(path.join(rootDir, "vite.config.ts")) ||
    existsSync(path.join(rootDir, "vite.config.mjs"))
  ) {
    framework = "vite";
  } else if ("react" in allDeps || "react-dom" in allDeps) {
    framework = "react";
  } else if ("vue" in allDeps || "nuxt" in allDeps) {
    framework = "vue";
  } else if ("svelte" in allDeps || "@sveltejs/kit" in allDeps) {
    framework = "svelte";
  } else if ("astro" in allDeps) {
    framework = "astro";
  }

  // Find all CSS files across the project dynamically
  const globalCssPaths = findCssFiles(rootDir, rootDir);

  // Check if any CSS file uses Tailwind v4 directives (@import "tailwindcss", @theme)
  let hasTailwindCssDirective = false;
  for (const relPath of globalCssPaths) {
    try {
      const cssContent = readFileSync(path.join(rootDir, relPath), "utf-8");
      if (/@import\s+["']tailwindcss["']|@theme\b|@plugin\b|@utility\b/.test(cssContent)) {
        hasTailwindCssDirective = true;
        break;
      }
    } catch {}
  }

  // Detect Styling Engine
  let stylingEngine: StylingEngine = "unknown";
  const tailwindConfigs = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
    "tailwind.config.cjs",
  ];
  let tailwindConfigPath: string | undefined;

  for (const cfg of tailwindConfigs) {
    const fullPath = path.join(rootDir, cfg);
    if (existsSync(fullPath)) {
      tailwindConfigPath = cfg;
      stylingEngine = "tailwind";
      break;
    }
  }

  if (stylingEngine === "unknown") {
    if (
      "tailwindcss" in allDeps ||
      "@tailwindcss/postcss" in allDeps ||
      "@tailwindcss/vite" in allDeps ||
      "@tailwindcss/cli" in allDeps ||
      hasTailwindCssDirective
    ) {
      stylingEngine = "tailwind";
    } else if ("styled-components" in allDeps || "@emotion/react" in allDeps) {
      stylingEngine = "styled-components";
    } else if (globalCssPaths.length > 0) {
      stylingEngine = "vanilla-css";
    }
  }

  // Determine Source and Component Directories
  const hasSrcDir = existsSync(path.join(rootDir, "src"));
  const srcDir = hasSrcDir ? "src" : ".";

  const potentialComponentDirs = [
    "components",
    "src/components",
    "app/components",
    "src/app/components",
    "ui",
    "src/ui",
    "app/ui",
    "src/app/ui",
  ];
  let componentsDir: string | undefined;
  for (const dir of potentialComponentDirs) {
    if (existsSync(path.join(rootDir, dir))) {
      componentsDir = dir;
      break;
    }
  }

  // Determine Routes Directory
  const potentialRoutesDirs = [
    "app",
    "src/app",
    "pages",
    "src/pages",
    "routes",
    "src/routes",
  ];
  let routesDir: string | undefined;
  for (const dir of potentialRoutesDirs) {
    if (existsSync(path.join(rootDir, dir))) {
      routesDir = dir;
      break;
    }
  }

  return {
    rootDir,
    framework,
    stylingEngine,
    srcDir,
    componentsDir,
    routesDir,
    tailwindConfigPath,
    globalCssPaths,
  };
}

