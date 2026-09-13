import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import * as path from "node:path";

describe("UI Keeper CLI", () => {
  const cliPath = path.resolve(__dirname, "../src/index.ts");

  test("runs --help and displays available commands", () => {
    const result = spawnSync("bun", ["run", cliPath, "--help"], {
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("init");
    expect(result.stdout).toContain("analyze");
    expect(result.stdout).toContain("audit");
    expect(result.stdout).toContain("inspect");
  });

  test("runs inspect and outputs valid JSON", () => {
    const result = spawnSync("bun", ["run", cliPath, "inspect", "."], {
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("config");
    expect(parsed).toHaveProperty("designSystem");
    expect(parsed).toHaveProperty("componentCatalog");
    expect(parsed).toHaveProperty("routes");
  });
});
