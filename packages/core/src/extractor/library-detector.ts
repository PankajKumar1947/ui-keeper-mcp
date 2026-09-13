import { readFileSync, existsSync, readdirSync } from "node:fs";
import * as path from "node:path";

export interface InstalledLibraryInfo {
  hasShadcn: boolean;
  hasRadix: boolean;
  hasLucide: boolean;
  hasFramerMotion: boolean;
  shadcnComponents: string[];
}

export function detectInstalledLibraries(rootDir: string): InstalledLibraryInfo {
  const pkgPath = path.join(rootDir, "package.json");
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};

  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      dependencies = pkg.dependencies || {};
      devDependencies = pkg.devDependencies || {};
    } catch {
      // Ignore JSON error
    }
  }

  const allDeps = { ...devDependencies, ...dependencies };

  const hasShadcn = existsSync(path.join(rootDir, "components.json")) || existsSync(path.join(rootDir, "src/components/ui")) || existsSync(path.join(rootDir, "components/ui"));
  const hasRadix = Object.keys(allDeps).some((k) => k.startsWith("@radix-ui/"));
  const hasLucide = "lucide-react" in allDeps;
  const hasFramerMotion = "framer-motion" in allDeps || "motion" in allDeps;

  const shadcnComponents: string[] = [];
  const potentialUiDirs = [
    path.join(rootDir, "src", "components", "ui"),
    path.join(rootDir, "components", "ui"),
  ];

  for (const uiDir of potentialUiDirs) {
    if (existsSync(uiDir)) {
      try {
        const files = readdirSync(uiDir);
        for (const file of files) {
          if (/\.(tsx|jsx)$/.test(file)) {
            shadcnComponents.push(path.basename(file, path.extname(file)));
          }
        }
      } catch {
        // Ignore read error
      }
    }
  }

  return {
    hasShadcn,
    hasRadix,
    hasLucide,
    hasFramerMotion,
    shadcnComponents,
  };
}
