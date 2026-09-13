import { describe, expect, test } from "bun:test";
import {
  DesignSystemSchema,
  ColorTokenSchema,
  ComponentCatalogSchema,
  ComponentEntrySchema,
  ProjectModelSchema,
  AuditReportSchema,
  AuditIssueSchema,
  BrowserCheckResultSchema,
} from "../src/schema";

describe("Core Domain Schemas", () => {
  test("validates a complete DesignSystem schema", () => {
    const rawDesignSystem = {
      framework: "nextjs",
      stylingEngine: "tailwind",
      colors: [
        { name: "primary", value: "#3b82f6", role: "primary", hex: "#3b82f6" },
        { name: "background", value: "#ffffff", role: "background" },
      ],
      spacing: [
        { name: "4", value: "1rem", pxValue: 16 },
        { name: "8", value: "2rem", pxValue: 32 },
      ],
      typography: [
        { name: "heading-1", fontFamily: "Inter", fontSize: "2.25rem", fontWeight: "700" },
      ],
      radius: [{ name: "md", value: "0.375rem", pxValue: 6 }],
      shadows: [{ name: "sm", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }],
      breakpoints: [{ name: "sm", raw: "640px", minWidth: 640 }],
    };

    const parsed = DesignSystemSchema.parse(rawDesignSystem);
    expect(parsed.version).toBe("1.0.0");
    expect(parsed.colors).toHaveLength(2);
    expect(parsed.spacing[0].pxValue).toBe(16);
    expect(parsed.framework).toBe("nextjs");
  });

  test("validates component catalog with variants and props", () => {
    const rawCatalog = {
      components: [
        {
          id: "components/ui/button.tsx#Button",
          name: "Button",
          filePath: "components/ui/button.tsx",
          exportType: "named",
          category: "button",
          props: [
            { name: "variant", type: "'default' | 'destructive' | 'outline'", required: false, defaultValue: "'default'" },
            { name: "disabled", type: "boolean", required: false },
          ],
          variants: [
            { name: "variant=destructive", props: { variant: "destructive" }, styles: "bg-red-500 text-white" },
          ],
          usageCount: 12,
        },
      ],
      totalCount: 1,
    };

    const parsed = ComponentCatalogSchema.parse(rawCatalog);
    expect(parsed.totalCount).toBe(1);
    expect(parsed.components[0].name).toBe("Button");
    expect(parsed.components[0].category).toBe("button");
  });

  test("validates full ProjectModel schema", () => {
    const rawModel = {
      config: {
        rootDir: "/projects/my-app",
        framework: "nextjs",
        stylingEngine: "tailwind",
        srcDir: "src",
        tailwindConfigPath: "tailwind.config.ts",
      },
      designSystem: {
        colors: [{ name: "primary", value: "#000000" }],
      },
      componentCatalog: {
        components: [],
        totalCount: 0,
      },
      routes: [
        { path: "/", filePath: "app/page.tsx", type: "page" },
        { path: "/pricing", filePath: "app/pricing/page.tsx", type: "page" },
      ],
    };

    const parsed = ProjectModelSchema.parse(rawModel);
    expect(parsed.config.framework).toBe("nextjs");
    expect(parsed.routes).toHaveLength(2);
  });

  test("validates AuditReport schema and issue types", () => {
    const rawReport = {
      timestamp: new Date().toISOString(),
      targetPath: "src/components/PricingCard.tsx",
      totalIssues: 2,
      errorsCount: 1,
      warningsCount: 1,
      issues: [
        {
          id: "issue-1",
          ruleId: "no-hardcoded-colors",
          category: "design-system-drift",
          severity: "warning",
          message: "Hardcoded hex color #1e293b found instead of theme token slate-800",
          location: { filePath: "src/components/PricingCard.tsx", line: 24, column: 18 },
          suggestedFix: {
            description: "Replace with bg-slate-800",
            replacementText: "bg-slate-800",
            confidence: "high",
            isAutoFixable: true,
          },
          confidence: "high",
        },
        {
          id: "issue-2",
          ruleId: "duplicate-component",
          category: "duplicate-component",
          severity: "error",
          message: "Custom button implementation duplicates components/ui/button.tsx",
          location: { filePath: "src/components/PricingCard.tsx", line: 40, column: 9 },
          confidence: "high",
        },
      ],
      summary: "Found 2 design system issues in PricingCard.tsx",
    };

    const parsed = AuditReportSchema.parse(rawReport);
    expect(parsed.totalIssues).toBe(2);
    expect(parsed.issues[0].suggestedFix?.isAutoFixable).toBe(true);
  });

  test("validates BrowserCheckResult schema", () => {
    const rawBrowserResult = {
      route: "/pricing",
      viewport: { name: "mobile", width: 375, height: 667 },
      hasOverflow: true,
      overflowElements: [
        {
          selector: "table.pricing-table",
          tagName: "TABLE",
          clientWidth: 375,
          scrollWidth: 507,
          overflowPx: 132,
          boundingBox: { x: 0, y: 150, width: 507, height: 300 },
        },
      ],
      a11yViolations: [
        {
          id: "image-alt",
          impact: "critical",
          description: "Images must have alternate text",
          help: "Elements must have an alt attribute",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
          nodes: [{ html: '<img src="/logo.png">', target: ["img.logo"] }],
        },
      ],
      passed: false,
    };

    const parsed = BrowserCheckResultSchema.parse(rawBrowserResult);
    expect(parsed.passed).toBe(false);
    expect(parsed.overflowElements).toHaveLength(1);
    expect(parsed.overflowElements[0].overflowPx).toBe(132);
    expect(parsed.a11yViolations[0].impact).toBe("critical");
  });
});
