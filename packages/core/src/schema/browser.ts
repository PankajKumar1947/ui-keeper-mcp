import { z } from "zod";

export const ViewportConfigSchema = z.object({
  name: z.string(),
  width: z.number(),
  height: z.number(),
  deviceScaleFactor: z.number().default(1),
});

export const OverflowIssueSchema = z.object({
  selector: z.string(),
  tagName: z.string(),
  clientWidth: z.number(),
  scrollWidth: z.number(),
  overflowPx: z.number(),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
});

export const A11yViolationSchema = z.object({
  id: z.string(),
  impact: z.enum(["minor", "moderate", "serious", "critical"]),
  description: z.string(),
  help: z.string(),
  helpUrl: z.string(),
  nodes: z.array(
    z.object({
      html: z.string(),
      target: z.array(z.string()),
      failureSummary: z.string().optional(),
    })
  ),
});

export const BrowserCheckResultSchema = z.object({
  route: z.string(),
  viewport: ViewportConfigSchema,
  hasOverflow: z.boolean(),
  overflowElements: z.array(OverflowIssueSchema).default([]),
  a11yViolations: z.array(A11yViolationSchema).default([]),
  screenshotPath: z.string().optional(),
  passed: z.boolean(),
});
