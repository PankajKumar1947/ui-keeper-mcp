# UI Keeper — Complete Usage Guide

This guide walks you through setting up and using **UI Keeper** with AI coding agents (OpenCode, Cursor, Claude Code, Windsurf), using the command-line interface (CLI), and enforcing team-wide quality guardrails with Git pre-commit hooks.

---

## Table of Contents

1. [Quick Start & Installation](#1-quick-start--installation)
2. [Connecting UI Keeper to AI Coding Agents (MCP)](#2-connecting-ui-keeper-to-ai-coding-agents-mcp)
   - [A. OpenCode](#a-opencode)
   - [B. Cursor](#b-cursor)
   - [C. Claude Code & Claude Desktop](#c-claude-code--claude-desktop)
   - [D. Windsurf](#d-windsurf)
3. [Local Stdio MCP vs Cloudflare Remote MCP](#3-local-stdio-mcp-vs-cloudflare-remote-mcp)
4. [Autonomous AI Guardrails (AGENTS.md / .cursorrules)](#4-autonomous-ai-guardrails)
5. [CLI Commands Reference](#5-cli-commands-reference)
6. [Git Pre-Commit Hook Setup](#6-git-pre-commit-hook-setup)
7. [Step-by-Step Workflows](#7-step-by-step-workflows)

---

## 1. Quick Start & Installation

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) or Node.js (v18+)

### Clone and Install
```bash
git clone https://github.com/your-org/ui-keeper.git
cd ui-keeper
bun install
```

### Verify Test Suite
```bash
bun test
```
*All 36 unit tests across 14 test suites should pass.*

---

## 2. Connecting UI Keeper to AI Coding Agents (MCP)

UI Keeper provides two MCP connection modes:
1. **Local Stdio MCP (`@ui-keeper/local-mcp`)** — **Recommended for local development.** Runs locally on your computer with direct access to your local filesystem.
2. **Cloudflare Remote MCP (`apps/remote-mcp`)** — Live globally deployed edge endpoint for remote or payload-based auditing.

---

### A. OpenCode

In your target project root (or globally in `~/.config/opencode/opencode.json`):

#### Option 1: Local Stdio MCP (Recommended for Local Filesystem Access)
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

#### Option 2: Live Cloudflare Remote MCP
```json
{
  "$schema": "https://opencode.ai/schema.json",
  "mcp": {
    "ui-keeper": {
      "type": "remote",
      "url": "https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp",
      "enabled": true
    }
  }
}
```

---

### B. Cursor

1. Open **Cursor Settings** -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.

#### Option 1: Local Stdio MCP (Recommended)
- **Name**: `ui-keeper`
- **Type**: `command`
- **Command**: `bun run /absolute/path/to/ui-keeper/packages/local-mcp/src/index.ts`

#### Option 2: Live Cloudflare Remote MCP
- **Name**: `ui-keeper`
- **Type**: `sse` / `http`
- **Server URL**: `https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp`

---

### C. Claude Code & Claude Desktop

Add to `claude_desktop_config.json`:

#### Option 1: Local Stdio MCP (Recommended)
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

#### Option 2: Live Cloudflare Remote MCP
```json
{
  "mcpServers": {
    "ui-keeper": {
      "url": "https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp"
    }
  }
}
```

---

### D. Windsurf

In your project's `.windsurfrules` or `mcp_config.json`:

#### Option 1: Local Stdio MCP (Recommended)
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

#### Option 2: Live Cloudflare Remote MCP
```json
{
  "mcpServers": {
    "ui-keeper": {
      "url": "https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp"
    }
  }
}
```

---

## 3. Local Stdio MCP vs Cloudflare Remote MCP

| Feature | Local Stdio MCP (`packages/local-mcp`) | Cloudflare Remote MCP (`apps/remote-mcp`) |
| :--- | :--- | :--- |
| **Execution Environment** | Runs locally on your machine via Bun/Node | Runs in Cloudflare Workers Edge data center |
| **Filesystem Access** | Direct full access to `/Users/.../project` | Sandboxed (cannot read client laptop disk) |
| **Best For** | Full repo scanning, component catalogs, local project audits | Webhook CI/CD, remote bots, payload code auditing |
| **Available Tools** | All 10 tools including `inspect_ui`, `audit_ui`, `get_ui_health_score` | Payload tools: `audit_code`, `extract_tokens_from_css`, `scaffold_component`, `find_design_token` |

> [!TIP]
> When pairing with an AI agent in your local IDE (Cursor, OpenCode, Windsurf), **always use the Local Stdio MCP**. It enables the agent to discover all local files (`app/token.css`, `components/*.tsx`, etc.) seamlessly.

---

## 4. Autonomous AI Guardrails

To instruct AI coding assistants to automatically inspect tokens and verify UI code without requiring manual prompts, add the following snippet to your project's `AGENTS.md` or `.cursorrules`:

```markdown
## Frontend Quality & UI Keeper Rules

- **1. Before Writing UI**:
  - ALWAYS call `inspect_design_system` to inspect colors, radii, and 4px spacing scale.
  - ALWAYS call `find_component` before creating new UI components to reuse existing catalog components.
- **2. Component Reuse**:
  - NEVER write raw primitive tags (`<button className="...">`, `<input ...>`) if a standardized component (e.g. `Button`, `Input`) exists.
- **3. After Writing UI**:
  - ALWAYS run `audit_ui` (or `audit_code`) on modified files to verify:
    - 0 hardcoded hex/rgb/hsl colors (map to project tokens).
    - Strict 4px spacing grid adherence (no off-grid values like `p-[18px]`).
    - 0 contradictory Tailwind classes (e.g. `flex block`).
    - WCAG 2.1 AA compliant contrast ratio (minimum 4.5:1).
    - No monolithic JSX duplicated across multiple files.
```

---

## 5. CLI Commands Reference

You can use the UI Keeper CLI directly from any terminal:

```bash
# Create an alias or execute with bun:
alias ui-keeper="bun /absolute/path/to/ui-keeper/packages/cli/src/index.ts"
```

### 1. `ui-keeper analyze [dir]`
Extracts detected framework, styling system, design tokens count, and component catalog.
```bash
ui-keeper analyze .
```

### 2. `ui-keeper audit [target]`
Scans target file or directory against the 7 UI quality rules.
```bash
# Audit entire project
ui-keeper audit .

# Audit a specific file
ui-keeper audit components/navbar.tsx
```

### 3. `ui-keeper fix [target]`
Runs automated fixes through the verification loop (Detect -> Fix -> Re-audit -> Keep/Revert).
```bash
ui-keeper fix components/card.tsx
```

### 4. `ui-keeper score [target]`
Calculates the 0-100% UI Health Score and letter grade (`A+` to `F`).
```bash
ui-keeper score .
```

### 5. `ui-keeper generate <name>`
Scaffolds a type-safe, token-compliant component file.
```bash
ui-keeper generate ProjectCard --category card --write
```

### 6. `ui-keeper inspect [dir]`
Dumps the complete raw ProjectModel JSON to stdout (great for piping into `jq` or external tools).
```bash
ui-keeper inspect . | jq .designSystem.colors
```

### 7. `ui-keeper hook install`
Installs a Git pre-commit hook that automatically blocks commits containing severe UI drift.
```bash
ui-keeper hook install
```

---

## 6. Git Pre-Commit Hook Setup

To enforce UI quality automatically before any code is committed to Git:

```bash
ui-keeper hook install
```

This creates `.git/hooks/pre-commit` which automatically:
1. Runs `ui-keeper audit` on staged `.tsx` and `.jsx` files.
2. Checks for design system drift and severe contrast violations.
3. Rejects the commit with line-by-line fix suggestions if severe errors are detected.

---

## 7. Step-by-Step Workflows

### Scenario A: AI Agent Building a New Page
1. AI Agent invokes `inspect_design_system` to learn the project's color palette, spacing grid, and radius tokens.
2. AI Agent invokes `find_component({ query: "card" })` and discovers an existing `ProjectCard` in `components/card.tsx`.
3. AI Agent writes the new page using `<ProjectCard />` instead of creating redundant inline HTML.
4. AI Agent invokes `audit_ui({ targetPath: "app/dashboard/page.tsx" })` to ensure 0 errors.

### Scenario B: Cleaning Up Legacy Style Drift
1. Developer runs `ui-keeper audit .` to identify all hardcoded colors and off-grid spacing values.
2. Developer runs `ui-keeper fix .` to apply automated high-confidence fixes.
3. The verification loop ensures only verified improvements are kept.
4. Developer runs `ui-keeper score .` to verify the new `A+` grade.
