import { readdirSync, statSync, existsSync } from "node:fs";
import * as path from "node:path";
import type { RouteEntry, RouteType } from "../types";

function scanDirectory(dir: string, baseDir: string, rootDir: string, isAppRouter: boolean): RouteEntry[] {
  const routes: RouteEntry[] = [];
  if (!existsSync(dir)) return routes;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      routes.push(...scanDirectory(fullPath, baseDir, rootDir, isAppRouter));
    } else {
      const relPath = path.relative(rootDir, fullPath);
      const relFromBase = path.relative(baseDir, fullPath);

      if (isAppRouter) {
        // Next.js App Router conventions: page.tsx, layout.tsx, route.ts
        if (/^page\.(tsx|jsx|js|ts)$/.test(entry)) {
          const dirFromBase = path.dirname(relFromBase);
          const routePath = dirFromBase === "." ? "/" : `/${dirFromBase.replace(/\\/g, "/")}`;
          routes.push({
            path: routePath,
            filePath: relPath,
            type: "page",
            dynamic: routePath.includes("[") && routePath.includes("]"),
          });
        } else if (/^layout\.(tsx|jsx|js|ts)$/.test(entry)) {
          const dirFromBase = path.dirname(relFromBase);
          const routePath = dirFromBase === "." ? "/" : `/${dirFromBase.replace(/\\/g, "/")}`;
          routes.push({
            path: routePath,
            filePath: relPath,
            type: "layout",
            dynamic: routePath.includes("["),
          });
        } else if (/^route\.(ts|js)$/.test(entry)) {
          const dirFromBase = path.dirname(relFromBase);
          const routePath = dirFromBase === "." ? "/api" : `/${dirFromBase.replace(/\\/g, "/")}`;
          routes.push({
            path: routePath,
            filePath: relPath,
            type: "api",
            dynamic: routePath.includes("["),
          });
        }
      } else {
        // Next.js Pages Router conventions: index.tsx, dashboard.tsx, [id].tsx
        if (/\.(tsx|jsx|js|ts)$/.test(entry) && !entry.startsWith("_") && !entry.includes(".test.")) {
          const withoutExt = relFromBase.replace(/\.(tsx|jsx|js|ts)$/, "");
          let routePath = `/${withoutExt.replace(/\\/g, "/")}`;
          if (routePath.endsWith("/index")) {
            routePath = routePath.slice(0, -6) || "/";
          }
          const isApi = routePath.startsWith("/api");
          routes.push({
            path: routePath,
            filePath: relPath,
            type: isApi ? "api" : "page",
            dynamic: routePath.includes("["),
          });
        }
      }
    }
  }

  return routes;
}

export function scanRoutes(rootDir: string, routesDir?: string): RouteEntry[] {
  if (!routesDir) {
    const potentialDirs = [
      path.join(rootDir, "src", "app"),
      path.join(rootDir, "app"),
      path.join(rootDir, "src", "pages"),
      path.join(rootDir, "pages"),
    ];
    for (const d of potentialDirs) {
      if (existsSync(d)) {
        const isAppRouter = d.endsWith("app");
        return scanDirectory(d, d, rootDir, isAppRouter);
      }
    }
    return [];
  }

  const fullRoutesDir = path.isAbsolute(routesDir) ? routesDir : path.join(rootDir, routesDir);
  const isAppRouter = routesDir.endsWith("app") || routesDir.includes("/app");
  return scanDirectory(fullRoutesDir, fullRoutesDir, rootDir, isAppRouter);
}
