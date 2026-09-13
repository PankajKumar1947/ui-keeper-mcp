# 🌐 @ui-keeper/remote-mcp

Edge-ready Remote Model Context Protocol (MCP) Server built with **[Hono](https://hono.dev)** and `@modelcontextprotocol/sdk` streamable HTTP transport, optimized for **Cloudflare Workers** and Bun.

---

## ⚡ Deployment to Cloudflare Workers

Deploy globally to Cloudflare Workers in seconds using Wrangler:

```bash
# 1. Login to Cloudflare (first time only)
bun x wrangler login

# 2. Deploy to Cloudflare Workers
cd apps/remote-mcp
bun run deploy
```

---

## 🚀 Running Locally

```bash
# Local edge simulation via Wrangler
bun --cwd apps/remote-mcp run cf:dev

# Or run directly with Bun
bun --cwd apps/remote-mcp run dev
```

---

## 📡 Endpoints

- `ALL /mcp` — WebStandard Streamable HTTP JSON-RPC MCP endpoint for AI coding agents.
- `GET /health` — Health check endpoint for uptime monitors.
- `GET /` — API metadata, framework, and transport status.

---

## 🤖 Connecting AI Clients to Remote MCP

In `mcp.json` / Cursor / OpenCode / Claude Code / Windsurf:
```json
{
  "mcpServers": {
    "ui-keeper-remote": {
      "url": "https://ui-keeper-remote-mcp.<your-subdomain>.workers.dev/mcp"
    }
  }
}
```

