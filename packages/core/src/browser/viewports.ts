import type { ViewportConfig } from "../types";

export const DEFAULT_VIEWPORTS: ViewportConfig[] = [
  {
    name: "mobile",
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
  },
  {
    name: "tablet",
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
  },
  {
    name: "desktop",
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
  },
];
