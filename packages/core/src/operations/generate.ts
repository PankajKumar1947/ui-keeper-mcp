import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import * as path from "node:path";
import { scaffoldComponent, type ScaffoldComponentOptions, type GeneratedComponentFile } from "../generator/component-scaffolder";

export interface GenerateOptions extends ScaffoldComponentOptions {
  rootDir?: string;
  outputPath?: string;
  writeToFile?: boolean;
}

export function generateComponent(options: GenerateOptions): GeneratedComponentFile & { savedPath?: string } {
  const result = scaffoldComponent(options);
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd();

  if (options.writeToFile) {
    const targetRelPath = options.outputPath || result.suggestedFilePath;
    const fullPath = path.isAbsolute(targetRelPath) ? targetRelPath : path.join(rootDir, targetRelPath);

    const dir = path.dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, result.code, "utf-8");
    return { ...result, savedPath: fullPath };
  }

  return result;
}
