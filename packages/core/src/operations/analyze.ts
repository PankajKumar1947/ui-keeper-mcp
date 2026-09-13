import * as path from "node:path";
import type { ProjectModel } from "../types";
import { detectProject } from "../extractor/project-detector";
import { extractTokens } from "../extractor/token-extractor";
import { scanComponents } from "../extractor/component-scanner";
import { scanRoutes } from "../extractor/route-scanner";

export interface AnalyzeOptions {
  rootDir?: string;
  componentsDir?: string;
  routesDir?: string;
}

export function analyzeProject(options: AnalyzeOptions = {}): ProjectModel {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd();

  // 1. Detect project environment and configuration
  const config = detectProject(rootDir);
  if (options.componentsDir) config.componentsDir = options.componentsDir;
  if (options.routesDir) config.routesDir = options.routesDir;

  // 2. Extract design system tokens
  const designSystem = extractTokens(config);

  // 3. Scan component catalog
  const componentCatalog = scanComponents(rootDir, config.componentsDir);

  // 4. Scan application routes
  const routes = scanRoutes(rootDir, config.routesDir);

  return {
    config,
    designSystem,
    componentCatalog,
    routes,
  };
}
