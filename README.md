# 🛡️ UI Keeper
> **The local-first frontend quality and verification layer for AI coding agents.**

UI Keeper turns AI coding assistants (**Cursor**, **OpenCode**, **Claude Code**, **Windsurf**, **Codex**) into disciplined design-system champions. It prevents arbitrary style drift, stops component duplication, catches repeated monolithic JSX, prunes conflicting Tailwind classes, validates WCAG contrast ratios, and automatically verifies fixes.

---

## ⚡ Quick Connect (Cloudflare Remote MCP)

Connect your favorite AI agent instantly with **zero installation** using our live globally distributed Cloudflare Worker:

**MCP Endpoint**: `https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp`

### 🟣 Cursor
1. Go to **Settings** $\rightarrow$ **Features** $\rightarrow$ **MCP** $\rightarrow$ **+ Add New MCP Server**.
2. **Name**: `ui-keeper`
3. **Type**: `sse` or `http`
4. **URL**: `https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp`

### 🟢 OpenCode
Add to `opencode.json` (or `~/.config/opencode/opencode.json`):
```json
{
  "mcp": {
    "ui-keeper": {
      "type": "remote",
      "url": "https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp",
      "enabled": true
    }
  }
}
```

### 🟠 Claude Code / Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ui-keeper": {
      "url": "https://ui-keeper-remote-mcp.veerukry79.workers.dev/mcp"
    }
  }
}
```

### 🌊 Windsurf
Add to `mcp_config.json`:
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

## 🤖 Zero-Touch Autonomous Quality

Add this to your project's `AGENTS.md` or `.cursorrules` to instruct your AI agents to automatically use UI Keeper tools:

```markdown
## Frontend Quality & UI Keeper Rules
- **Before Writing UI**: ALWAYS call `inspect_design_system` and `find_component` to reuse existing components and tokens.
- **Component Reuse**: Never build raw primitive HTML elements if a design-system component exists in the catalog.
- **After Writing UI**: ALWAYS run `audit_ui` to ensure:
  - 0 design system drift (strict 4px grid adherence).
  - 0 conflicting Tailwind classes.
  - 0 WCAG AA contrast ratio violations (minimum 4.5:1).
  - No repeated monolithic inline JSX (extract reusable components).
```

---

## 🛠️ Monorepo Architecture

- **`@ui-keeper/core`** ([`packages/core`](file:///Users/pankaj/Developer/projects/ui-keeper/packages/core)): AST scanner, token extractor, 7 static audit rules, verification loop, and scaffolding engine.
- **`@ui-keeper/cli`** ([`packages/cli`](file:///Users/pankaj/Developer/projects/ui-keeper/packages/cli)): Command-line tool (`analyze`, `audit`, `fix`, `score`, `generate`, `inspect`, `hook`).
- **`@ui-keeper/local-mcp`** ([`packages/local-mcp`](file:///Users/pankaj/Developer/projects/ui-keeper/packages/local-mcp)): Stdio MCP server for local execution.
- **`@ui-keeper/remote-mcp`** ([`apps/remote-mcp`](file:///Users/pankaj/Developer/projects/ui-keeper/apps/remote-mcp)): Edge-ready Hono + Streamable HTTP MCP server on Cloudflare Workers.

---

## 📚 Complete Documentation

Read the complete [DOCUMENTATION.md](file:///Users/pankaj/Developer/projects/ui-keeper/DOCUMENTATION.md) for full tool references, rule definitions, scoring algorithms, and Git pre-commit hook setups.
