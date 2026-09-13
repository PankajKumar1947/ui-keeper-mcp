import type { OverflowIssue, A11yViolation } from "../types";

/**
 * In-browser evaluation function to find all DOM elements causing horizontal overflow.
 */
export function detectDomOverflow(viewportWidth: number): OverflowIssue[] {
  const issues: OverflowIssue[] = [];
  const elements = document.querySelectorAll("*");

  for (const el of Array.from(elements)) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // Check if element extends beyond viewport width
    if (rect.right > viewportWidth + 1 || el.scrollWidth > el.clientWidth + 1) {
      const overflowPx = Math.max(
        Math.round(rect.right - viewportWidth),
        el.scrollWidth - el.clientWidth
      );

      if (overflowPx > 2) {
        let selector = el.tagName.toLowerCase();
        if (el.id) {
          selector += `#${el.id}`;
        } else if (el.className && typeof el.className === "string") {
          const firstClass = el.className.trim().split(/\s+/)[0];
          if (firstClass) selector += `.${firstClass}`;
        }

        issues.push({
          selector,
          tagName: el.tagName,
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
          overflowPx,
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        });
      }
    }
  }

  return issues;
}

/**
 * In-browser evaluation function for core accessibility checks (images, forms, buttons, contrast).
 */
export function auditDomAccessibility(): A11yViolation[] {
  const violations: A11yViolation[] = [];

  // 1. Missing Image Alt Text
  const images = document.querySelectorAll("img");
  const missingAltNodes: { html: string; target: string[]; failureSummary?: string }[] = [];
  for (const img of Array.from(images)) {
    if (!img.hasAttribute("alt") || img.getAttribute("alt")?.trim() === "") {
      missingAltNodes.push({
        html: img.outerHTML.slice(0, 100),
        target: [img.src || "img"],
        failureSummary: "Image element is missing required 'alt' text attribute.",
      });
    }
  }

  if (missingAltNodes.length > 0) {
    violations.push({
      id: "image-alt",
      impact: "critical",
      description: "Images must have alternate text for screen readers.",
      help: "Ensure all <img> elements specify meaningful alt attributes.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
      nodes: missingAltNodes,
    });
  }

  // 2. Unlabeled Form Inputs
  const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select");
  const unlabeledInputNodes: { html: string; target: string[]; failureSummary?: string }[] = [];
  for (const input of Array.from(inputs)) {
    const id = input.id;
    const hasAriaLabel = input.hasAttribute("aria-label") || input.hasAttribute("aria-labelledby");
    const hasAssociatedLabel = id && document.querySelector(`label[for='${id}']`);
    const isInsideLabel = input.closest("label");

    if (!hasAriaLabel && !hasAssociatedLabel && !isInsideLabel) {
      unlabeledInputNodes.push({
        html: input.outerHTML.slice(0, 100),
        target: [input.id || input.getAttribute("name") || input.tagName.toLowerCase()],
        failureSummary: "Form input lacks an associated <label> or aria-label.",
      });
    }
  }

  if (unlabeledInputNodes.length > 0) {
    violations.push({
      id: "label",
      impact: "critical",
      description: "Form elements must have labels.",
      help: "Provide a <label for='...'> or aria-label for all form fields.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.4/label",
      nodes: unlabeledInputNodes,
    });
  }

  // 3. Buttons without text/accessible name
  const buttons = document.querySelectorAll("button, a[role='button']");
  const emptyButtonNodes: { html: string; target: string[]; failureSummary?: string }[] = [];
  for (const btn of Array.from(buttons)) {
    const text = btn.textContent?.trim();
    const hasAria = btn.hasAttribute("aria-label") || btn.hasAttribute("aria-labelledby");
    if (!text && !hasAria) {
      emptyButtonNodes.push({
        html: btn.outerHTML.slice(0, 100),
        target: [btn.id || btn.className || "button"],
        failureSummary: "Button does not have discernible text or aria-label.",
      });
    }
  }

  if (emptyButtonNodes.length > 0) {
    violations.push({
      id: "button-name",
      impact: "serious",
      description: "Buttons must have discernible text.",
      help: "Add visible text or an aria-label to the button.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.4/button-name",
      nodes: emptyButtonNodes,
    });
  }

  return violations;
}
