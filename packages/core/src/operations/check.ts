import type { BrowserCheckResult, ViewportConfig } from "../types";
import { checkHtmlMarkup } from "../browser/runner";
import { DEFAULT_VIEWPORTS } from "../browser/viewports";

export interface CheckOptions {
  htmlContent: string;
  route?: string;
  viewports?: ViewportConfig[];
}

export function checkPage(options: CheckOptions): BrowserCheckResult[] {
  return checkHtmlMarkup(options.htmlContent, {
    route: options.route,
    viewports: options.viewports || DEFAULT_VIEWPORTS,
  });
}
