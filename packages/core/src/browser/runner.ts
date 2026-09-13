import type { BrowserCheckResult, ViewportConfig } from "../types";
import { DEFAULT_VIEWPORTS } from "./viewports";
import { detectDomOverflow, auditDomAccessibility } from "./checker";

export interface CheckHtmlOptions {
  route?: string;
  viewports?: ViewportConfig[];
}

export function checkHtmlMarkup(
  htmlContent: string,
  options: CheckHtmlOptions = {}
): BrowserCheckResult[] {
  const route = options.route || "/";
  const viewports = options.viewports || DEFAULT_VIEWPORTS;
  const results: BrowserCheckResult[] = [];

  // Parse HTML for static QA
  const missingAltRegex = /<img(?![^>]*\balt=)[^>]*>/gi;
  const missingLabelRegex = /<input(?![^>]*\b(aria-label|aria-labelledby|hidden)=)[^>]*>/gi;

  const a11yViolations = [];

  const missingAltMatches = Array.from(htmlContent.matchAll(missingAltRegex));
  if (missingAltMatches.length > 0) {
    a11yViolations.push({
      id: "image-alt",
      impact: "critical" as const,
      description: "Images must have alternate text for screen readers.",
      help: "Ensure all <img> elements specify meaningful alt attributes.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
      nodes: missingAltMatches.map((m) => ({
        html: m[0],
        target: ["img"],
        failureSummary: "Image element is missing required 'alt' text attribute.",
      })),
    });
  }

  // Check fixed-width overflow risks (e.g. w-[600px] or min-w-[500px] or fixed tables)
  const fixedWidthMatch = htmlContent.matchAll(/\b(?:w|min-w)-\[(\d+)px\]/g);
  const fixedWidths = Array.from(fixedWidthMatch).map((m) => parseInt(m[1], 10));

  for (const vp of viewports) {
    const overflows = [];
    for (const w of fixedWidths) {
      if (w > vp.width) {
        overflows.push({
          selector: `[w-${w}px]`,
          tagName: "DIV",
          clientWidth: vp.width,
          scrollWidth: w,
          overflowPx: w - vp.width,
          boundingBox: { x: 0, y: 0, width: w, height: 100 },
        });
      }
    }

    results.push({
      route,
      viewport: vp,
      hasOverflow: overflows.length > 0,
      overflowElements: overflows,
      a11yViolations,
      passed: overflows.length === 0 && a11yViolations.length === 0,
    });
  }

  return results;
}
