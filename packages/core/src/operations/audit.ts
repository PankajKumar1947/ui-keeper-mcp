import * as path from "node:path";
import type { AuditReport } from "../types";
import { analyzeProject } from "./analyze";
import { runAudit } from "../audit/engine";

export interface AuditProjectOptions {
  rootDir?: string;
  targetPath?: string;
}

export function auditProject(options: AuditProjectOptions = {}): AuditReport {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd();
  const projectModel = analyzeProject({ rootDir });

  return runAudit({
    targetPath: options.targetPath,
    projectModel,
  });
}
