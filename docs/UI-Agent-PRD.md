# UI Agent — Short PRD

## 1. Product

**UI Agent** is a free, open-source, local-first frontend quality agent that plugs into AI coding tools such as **Cursor, Claude Code, Codex, Windsurf, and other MCP-compatible agents**.

> **Your coding agent builds the UI. UI Agent makes sure it stays good.**

It understands the existing frontend, extracts its design system, audits generated UI, checks it in a real browser, and helps fix problems.

---

## 2. Problem

AI coding agents can generate frontend code quickly, but often introduce:

- Inconsistent colors, spacing, typography, radius, and shadows
- Duplicate components and styles
- Design-system drift
- Responsive/mobile bugs
- Accessibility issues
- Visual regressions
- Unnecessary Tailwind/CSS patterns
- Frontend technical debt

Developers currently have to manually review and clean these issues.

---

## 3. Core Workflow

```text
AI Coding Agent
      ↓
   UI Agent
      ↓
Understand project
      ↓
Extract design system
      ↓
Audit code + UI
      ↓
Render in browser
      ↓
Detect problems
      ↓
Suggest / Apply fixes
      ↓
Re-render & verify
```

---

# 4. Core Features

## A. Design System Extraction

Automatically understand an existing project.

Extract:

- Colors
- Spacing scale
- Typography
- Border radius
- Shadows
- Breakpoints
- Components
- UI patterns
- CSS variables / Tailwind tokens
- Framework and styling approach

Example:

```text
Detected UI System

Colors:       14
Spacing:       6
Typography:    8
Radius:        4
Components:   47
Routes:       18
```

---

## B. UI Audit

Find inconsistencies in the codebase.

Examples:

```text
⚠ 8 similar colors detected
⚠ 5 button implementations detected
⚠ 4 different card radii
⚠ 3 duplicated components
⚠ New spacing value: 18px
```

Each issue includes:

- Location
- Severity
- Explanation
- Suggested fix
- Confidence

---

## C. Visual QA

Run the application in a real browser using Playwright.

Check:

- Layout
- Spacing
- Typography
- Colors
- Component consistency
- Overflow
- Alignment
- Visual regressions

Support multiple viewports:

```text
375px
768px
1440px
```

---

## D. Responsive Testing

Automatically detect:

- Horizontal overflow
- Broken grids
- Fixed-width elements
- Incorrect breakpoints
- Mobile navigation problems
- Text wrapping issues
- Image overflow
- Mobile spacing problems

Example:

```text
❌ /dashboard
Table overflows by 132px at 375px.

⚠ /settings
Sidebar remains 280px on mobile.
```

---

## E. Accessibility Checks

Detect common issues:

- Missing alt text
- Missing form labels
- Poor contrast
- Heading hierarchy
- Keyboard navigation
- Focus visibility
- Incorrect ARIA usage
- Small touch targets

Use established tooling such as `axe-core`.

---

## F. Auto Fix

High-confidence issues can be fixed automatically.

```bash
ui-agent fix
```

Example:

```text
✓ Replaced duplicate color with existing token
✓ Reused existing Button component
✓ Fixed mobile overflow
✓ Added missing image alt text
```

For risky changes, ask for confirmation.

---

## G. Verification Loop

UI Agent should never assume a fix worked.

```text
Detect
  ↓
Fix
  ↓
Render
  ↓
Compare
  ↓
Better?
 ├─ Yes → Keep
 └─ No  → Revert
```

This is one of the core differentiators.

---

# 5. MCP Integration

UI Agent works as a tool for existing coding agents.

Expose tools such as:

```text
inspect_ui
audit_ui
inspect_design_system
find_component
find_design_token
render_page
check_responsive
check_accessibility
compare_ui
suggest_ui_fix
apply_ui_fix
```

Example:

> Developer: "Build a pricing page."

Coding agent creates it.

UI Agent responds:

```text
UI Review

❌ PricingButton duplicates Button.tsx
⚠ New color does not match product tokens
❌ Cards overflow at 375px

Suggested fixes available.
```

The coding agent can then apply the fixes.

---

# 6. CLI

```bash
ui-agent init
ui-agent analyze
ui-agent audit
ui-agent check
ui-agent fix
ui-agent inspect
ui-agent mcp
```

### `init`

Detect framework, styling system, components, routes, and generate the local UI model.

### `analyze`

Extract the project's design system.

### `audit`

Find static UI/design-system problems.

### `check`

Run browser, responsive, visual, and accessibility checks.

### `fix`

Apply high-confidence fixes and verify them.

### `mcp`

Expose UI Agent to AI coding tools.

---

# 7. Framework & Styling Support

The product should be framework/styling agnostic.

### Initial

- React
- Next.js
- Tailwind
- Core CSS
- CSS Modules

### Later

- Vue
- Nuxt
- Svelte
- Astro
- Angular
- SCSS
- styled-components
- Emotion

**Tailwind is an output/implementation detail, not the internal representation.**

---

# 8. MVP

Build only:

1. Project analyzer
2. Design-system extractor
3. Static UI auditor
4. Playwright browser runner
5. Responsive checker
6. Accessibility checker
7. MCP server
8. Basic high-confidence auto-fixes

Focus initially on **React/Next.js**.

---

# 9. Open Source Strategy

The core product should be:

- Free
- Open source
- Local-first
- No mandatory account
- No mandatory hosted backend
- Compatible with existing AI coding tools

The developer's existing AI model performs the reasoning; UI Agent provides the specialized frontend tools, project knowledge, browser access, and analysis.

---

# 10. Future Paid Layer

Keep the developer tool free.

Potential paid team/cloud features later:

- GitHub PR checks
- CI/CD
- Visual regression history
- Team dashboards
- Shared design-system policies
- Organization-wide rules
- Cloud browser execution
- Cross-repository UI analytics

---

# 11. Positioning

### Not:

- Another AI website builder
- Another coding agent
- Another Tailwind library
- Another Figma-to-code tool

### Instead:

> **The frontend quality layer for AI coding agents.**

Or:

> **Your coding agent writes the UI. UI Agent reviews, fixes, and verifies it.**

---

# 12. Long-Term Vision

Create a persistent **Product UI DNA** that AI coding agents can use.

```text
Code
+
Design System
+
Components
+
Patterns
+
Runtime UI
+
Visual History
+
Developer-approved fixes
        ↓
   Product UI DNA
        ↓
Cursor / Claude / Codex / Other Agents
```

The ultimate goal is to prevent **AI-generated frontend drift** while allowing developers to build much faster.
