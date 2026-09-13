# 🛡️ UI Keeper — User Guide & Documentation

> **The frontend quality and verification layer for AI coding agents (Cursor, OpenCode, Claude Code, Windsurf, Codex).**

---

## 📖 Table of Contents

1. [What is UI Keeper?](#1-what-is-ui-keeper)
2. [Quick Start](#2-quick-start)
3. [Connecting UI Keeper to AI Coding Agents (MCP)](#3-connecting-ui-keeper-to-ai-coding-agents-mcp)
   - [OpenCode](#a-opencode)
   - [Cursor](#b-cursor)
   - [Claude Code / Claude Desktop](#c-claude-code--claude-desktop)
   - [Windsurf](#d-windsurf)
4. [Zero-Touch Autonomous Quality (AGENTS.md / .cursorrules)](#4-zero-touch-autonomous-quality)
5. [Available MCP Tools](#5-available-mcp-tools)
6. [CLI Commands](#6-cli-commands)
7. [Built-in Audit Rules](#7-built-in-audit-rules)
8. [Health Score & Metrics](#8-health-score--metrics)
9. [Pre-Commit Quality Guardrails](#9-pre-commit-quality-guardrails)

---

## 1. What is UI Keeper?

AI coding agents can generate frontend code quickly, but they often introduce:
- **Design System Drift**: Guessing arbitrary pixel values (`p-[18px]`) or hardcoding random colors (`#1e293b`).
- **Component Duplication**: Writing monolithic, inline HTML tags instead of reusing existing buttons, cards, or inputs.
- **Repeated Monolithic JSX**: Copy-pasting the same complex styled wrappers 4+ times instead of creating a reusable component.
- **Tailwind Class Bloat**: Adding conflicting or redundant classes (`flex block`, `text-left text-center`).
- **Accessibility & Contrast Violations**: Low-contrast text failing WCAG AA ($< 4.5:1$), missing image alt texts, or unlabelled inputs.

**UI Keeper solves this** by acting as an intelligent quality layer that audits, normalizes, scaffolds, and auto-fixes UI code with a deterministic verification loop.

---

## 2. Quick Start

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) or Node.js (v18+)

### Clone & Install
```bash
git clone https://github.com/your-org/ui-keeper.git
cd ui-keeper
bun install
```

### Run Tests
```bash
bun test
```

---

## 3. Connecting UI Keeper to AI Coding Agents (MCP)

UI Keeper includes a Model Context Protocol (MCP) server located at `packages/local-mcp/src/index.ts`.

### A. OpenCode

In your target project's root directory, create or add to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/schema.json",
  "mcp": {
    "ui-keeper": {
      "type": "local",
      "command": [
        "bun",
        "run",
        "/absolute/path/to/ui-keeper/packages/local-mcp/src/index.ts"
      ],
      "enabled": true
    }
  }
}
```

*Tip: To enable UI Keeper globally for all OpenCode projects, save this file to `~/.config/opencode/opencode.json`.*

---

### B. Cursor

1. Open **Cursor Settings** $\rightarrow$ **Features** $\rightarrow$ **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in:
   - **Name**: `ui-keeper`
   - **Type**: `command`
   - **Command**: `bun run /absolute/path/to/ui-keeper/packages/local-mcp/src/index.ts`

---

### C. Claude Code / Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ui-keeper": {
      "command": "bun",
      "args": [
        "run",
        "/absolute/path/to/ui-keeper/packages/local-mcp/src/index.ts"
      ]
    }
  }
}
```

---

### D. Windsurf

In your project's `.windsurfrules` or `mcp_config.json`:

```json
{
  "mcpServers": {
    "ui-keeper": {
      "command": "bun",
      "args": [
        "run",
        "/absolute/path/to/ui-keeper/packages/local-mcp/src/index.ts"
      ]
    }
  }
}
```

---

## 4. Zero-Touch Autonomous Quality

To make your AI coding agent **automatically** inspect, reuse components, and verify UI quality without requiring manual commands, add this section to your project's `AGENTS.md` or `.cursorrules`:

```markdown
## Frontend Quality & UI Rules
- **Before Writing UI**: ALWAYS invoke `inspect_design_system` and `find_component` to inspect project tokens, colors, and existing reusable components.
- **Component Reuse**: Never write raw primitive tags (`<button className="...">`, `<input className="...">`) when standardized catalog components exist.
- **After Writing UI**: ALWAYS run `audit_ui` to ensure:
  - 0 design system drift (strict adherence to the 4px Tailwind grid).
  - 0 conflicting or redundant Tailwind classes.
  - 0 WCAG contrast ratio violations (minimum 4.5:1 for body text).
  - No repeated inline JSX structures (extract reusable components when repeated 2+ times).
```

---

## 5. Available MCP Tools

| Tool Name | Description | Example Arguments |
| :--- | :--- | :--- |
| **`inspect_design_system`** | Extracts all colors, spacing scale, typography, radius, shadows, and breakpoints. | `{ "rootDir": "." }` |
| **`inspect_ui`** | Complete UI model (framework, styling engine, tokens, component catalog, routes). | `{ "rootDir": "." }` |
| **`audit_ui`** | Audits target files for drift, conflicts, repeated code, and accessibility issues. | `{ "targetPath": "components/navbar.tsx" }` |
| **`get_ui_health_score`** | Returns a 0–100% score, letter grade (`A+` to `F`), and improvement tips. | `{ "rootDir": "." }` |
| **`scaffold_component`** | Generates production-ready, typed, token-compliant React components. | `{ "name": "ProjectCard", "category": "card" }` |
| **`find_component`** | Searches the project catalog for existing components to prevent duplicates. | `{ "query": "button" }` |
| **`find_design_token`** | Finds the exact or closest design token for a color hex/rgb or spacing px. | `{ "type": "color", "value": "#1e293b" }` |
| **`apply_ui_fix`** | Applies automated fixes and verifies improvement using the verification loop. | `{ "targetPath": "." }` |

---

## 6. CLI Commands

You can run UI Keeper directly in any project terminal:

```bash
# Alias or path to CLI:
alias ui-keeper="bun /path/to/ui-keeper/packages/cli/src/index.ts"
```

### 🔬 1. Project Analysis
```bash
ui-keeper analyze .
```
*Outputs detected framework (Next.js/Vite), styling system, tokens count, component catalog, and page routes.*

### 🔎 2. Static UI Audit
```bash
ui-keeper audit .
# Or audit a specific file:
ui-keeper audit components/projects-list.tsx
```
*Scans code for design system drift, conflicting classes, off-grid values, and contrast violations.*

### 🛠️ 3. Auto-Fix with Verification Loop
```bash
ui-keeper fix .
```
*Automatically replaces hardcoded colors and arbitrary values with tokens, verifies that issue count decreased, and reverts if regressions occur.*

### 📊 4. Design System Health Score & Grade
```bash
ui-keeper score .
```
*Calculates Token Adoption %, Component Reuse %, and Cleanliness % with an overall letter grade.*

### ⚡ 5. Component Generator
```bash
ui-keeper generate card "ProjectCard"
ui-keeper generate badge "StatusBadge"
ui-keeper generate stat "MetricsBox"
```
*Creates a fully-typed, token-compliant React component file in your `components/` directory.*

### 🪝 6. Git Pre-Commit Hook Installation
```bash
ui-keeper hook install
```
*Installs `.git/hooks/pre-commit` to prevent committing code with UI errors or severe design drift.*

---

## 7. Built-in Audit Rules

1. **`no-hardcoded-colors`**
   - Flags raw hex/rgb values (`#1e293b`, `bg-[#0f172a]`) and maps them to nearest theme tokens (`bg-slate-800`).
2. **`no-arbitrary-spacing`**
   - Enforces the **4px base grid** ($x \times 4\text{px}$). Snaps arbitrary values (`p-[18px]`, `gap-[13px]`) and converts redundant brackets (`p-[24px]` $\rightarrow$ `p-6`, `p-[1.5rem]` $\rightarrow$ `p-6`).
3. **`no-duplicate-components`**
   - Catches raw `<button className="...">` or `<input className="...">` and recommends using existing catalog components.
4. **`no-repeated-inline-jsx`**
   - Detects complex JSX subtrees repeated 2+ times in a file and recommends extracting them into a dedicated component.
5. **`no-conflicting-classes`**
   - Detects conflicting Tailwind utilities (`flex block`, `text-left text-center`, `p-4 px-6`) and prunes overridden classes.
6. **`wcag-contrast-ratio`**
   - Evaluates foreground and background colors in JSX against WCAG 2.1 AA requirements ($4.5:1$ for body text).
7. **`no-rebuilding-library-components`**
   - Warns when an agent attempts to code custom modal backdrops or popovers from scratch when `shadcn/ui` or Radix is installed.

---

## 8. Health Score & Metrics

UI Keeper calculates an objective **0–100% Health Score**:

$$\text{Health Score} = (\text{Token Adoption} \times 0.35) + (\text{Component Reuse} \times 0.35) + (\text{Cleanliness} \times 0.30)$$

- **A+ (95–100%)**: Pristine design system adherence.
- **A (85–94%)**: Great quality, minor token suggestions.
- **B (75–84%)**: Good, some arbitrary spacing or duplicate components.
- **C (60–74%)**: Moderate drift; multiple unextracted JSX structures.
- **D / F (< 60%)**: Severe drift, hardcoded styles, and contrast errors.

---

## 9. Pre-Commit Quality Guardrails

Run:
```bash
ui-keeper hook install
```
This automatically sets up your pre-commit hook so that:
- Every `git commit` runs `ui-keeper audit`.
- If blocking errors are found, the commit is prevented until fixed, keeping your repository clean and drift-free.
