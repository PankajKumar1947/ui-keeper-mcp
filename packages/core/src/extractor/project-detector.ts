import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import type { ProjectConfig, FrameworkType, StylingEngine } from "../types";

export interface DetectProjectOptions {
  rootDir?: string;
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
  if ("next" in allDeps || existsSync(path.join(rootDir, "next.config.js")) || existsSync(path.join(rootDir, "next.config.mjs")) || existsSync(path.join(rootDir, "next.config.ts"))) {
    framework = "nextjs";
  } else if ("vite" in allDeps || existsSync(path.join(rootDir, "vite.config.js")) || existsSync(path.join(rootDir, "vite.config.ts"))) {
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
    if ("tailwindcss" in allDeps || "@tailwindcss/postcss" in allDeps || "@tailwindcss/vite" in allDeps) {
      stylingEngine = "tailwind";
    } else if ("styled-components" in allDeps || "@emotion/react" in allDeps) {
      stylingEngine = "styled-components";
    } else {
      stylingEngine = "vanilla-css";
    }
  }

  // Determine Source and Component Directories
  const hasSrcDir = existsSync(path.join(rootDir, "src"));
  const srcDir = hasSrcDir ? "src" : ".";

  const potentialComponentDirs = [
    path.join(srcDir, "components"),
    path.join(srcDir, "ui"),
    "components",
    "ui",
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
    path.join(srcDir, "app"),
    path.join(srcDir, "pages"),
    path.join(srcDir, "routes"),
    "app",
    "pages",
    "routes",
  ];
  let routesDir: string | undefined;
  for (const dir of potentialRoutesDirs) {
    if (existsSync(path.join(rootDir, dir))) {
      routesDir = dir;
      break;
    }
  }

  // Find Global CSS files
  const potentialCssFiles = [
    path.join(srcDir, "globals.css"),
    path.join(srcDir, "global.css"),
    path.join(srcDir, "index.css"),
    path.join(srcDir, "app.css"),
    path.join(srcDir, "main.css"),
    path.join(srcDir, "styles/globals.css"),
    path.join(srcDir, "styles/global.css"),
    path.join(srcDir, "styles/index.css"),
    "globals.css",
    "styles/globals.css",
    "src/app/globals.css",
    "app/globals.css",
  ];

  const globalCssPaths: string[] = [];
  for (const cssFile of potentialCssFiles) {
    if (existsSync(path.join(rootDir, cssFile)) && !globalCssPaths.includes(cssFile)) {
      globalCssPaths.push(cssFile);
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
