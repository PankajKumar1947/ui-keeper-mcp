import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { scanComponents } from "../src/extractor/component-scanner";
import { scanRoutes } from "../src/extractor/route-scanner";

describe("Component Scanner", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-comp-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("scans React TSX components and extracts props & categories", () => {
    const compDir = path.join(tempDir, "src", "components", "ui");
    mkdirSync(compDir, { recursive: true });

    // 1. Button component
    writeFileSync(
      path.join(compDir, "button.tsx"),
      `
      import React from "react";

      export interface ButtonProps {
        variant?: "primary" | "secondary" | "danger";
        size?: "sm" | "md" | "lg";
        disabled?: boolean;
        onClick?: () => void;
        children: React.ReactNode;
      }

      export function Button(props: ButtonProps) {
        return <button className="btn">{props.children}</button>;
      }
      `
    );

    // 2. Card component
    writeFileSync(
      path.join(compDir, "card.tsx"),
      `
      import React from "react";

      export interface CardProps {
        title: string;
        children: React.ReactNode;
      }

      export const Card: React.FC<CardProps> = ({ title, children }) => {
        return <div className="card"><h3>{title}</h3>{children}</div>;
      };

      export default Card;
      `
    );

    const catalog = scanComponents(tempDir, "src/components");

    expect(catalog.totalCount).toBe(2);
    const buttonComp = catalog.components.find((c) => c.name === "Button");
    expect(buttonComp).toBeDefined();
    expect(buttonComp?.category).toBe("button");
    expect(buttonComp?.props.some((p) => p.name === "variant")).toBe(true);

    const cardComp = catalog.components.find((c) => c.name === "Card");
    expect(cardComp).toBeDefined();
    expect(cardComp?.category).toBe("card");
    expect(cardComp?.props.some((p) => p.name === "title")).toBe(true);
  });
});

describe("Route Scanner", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "ui-keeper-routes-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("scans Next.js App router routes", () => {
    const appDir = path.join(tempDir, "src", "app");
    mkdirSync(path.join(appDir, "dashboard"), { recursive: true });
    mkdirSync(path.join(appDir, "settings", "profile"), { recursive: true });
    mkdirSync(path.join(appDir, "api", "health"), { recursive: true });

    writeFileSync(path.join(appDir, "page.tsx"), "export default function Page() {}");
    writeFileSync(path.join(appDir, "dashboard", "page.tsx"), "export default function Dashboard() {}");
    writeFileSync(path.join(appDir, "settings", "profile", "page.tsx"), "export default function Profile() {}");
    writeFileSync(path.join(appDir, "api", "health", "route.ts"), "export async function GET() {}");

    const routes = scanRoutes(tempDir, "src/app");

    expect(routes.some((r) => r.path === "/" && r.type === "page")).toBe(true);
    expect(routes.some((r) => r.path === "/dashboard" && r.type === "page")).toBe(true);
    expect(routes.some((r) => r.path === "/settings/profile" && r.type === "page")).toBe(true);
    expect(routes.some((r) => r.path === "/api/health" && r.type === "api")).toBe(true);
  });
});
