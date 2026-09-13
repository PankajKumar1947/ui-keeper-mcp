import { describe, expect, test } from "bun:test";
import { checkPage } from "../src/operations/check";

describe("Visual, Responsive & A11y Runner", () => {
  test("detects mobile viewport overflow with fixed width elements", () => {
    const html = `
      <div class="container">
        <div class="w-[500px] bg-blue-500">Fixed Wide Card</div>
      </div>
    `;

    const results = checkPage({ htmlContent: html, route: "/dashboard" });

    // Mobile (375px) should fail due to 500px element
    const mobileResult = results.find((r) => r.viewport.name === "mobile");
    expect(mobileResult).toBeDefined();
    expect(mobileResult?.hasOverflow).toBe(true);
    expect(mobileResult?.overflowElements[0].overflowPx).toBe(125);
    expect(mobileResult?.passed).toBe(false);

    // Desktop (1440px) should pass overflow check
    const desktopResult = results.find((r) => r.viewport.name === "desktop");
    expect(desktopResult).toBeDefined();
    expect(desktopResult?.hasOverflow).toBe(false);
  });

  test("detects missing image alt tags for accessibility", () => {
    const html = `
      <div>
        <img src="/hero.png" />
      </div>
    `;

    const results = checkPage({ htmlContent: html, route: "/landing" });
    const result = results[0];

    expect(result.a11yViolations).toHaveLength(1);
    expect(result.a11yViolations[0].id).toBe("image-alt");
    expect(result.a11yViolations[0].impact).toBe("critical");
    expect(result.passed).toBe(false);
  });
});
