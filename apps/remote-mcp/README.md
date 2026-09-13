# 🌐 @ui-keeper/remote-mcp

Deployable Remote Model Context Protocol (MCP) Server built with **[Hono](https://hono.dev)** and Server-Sent Events (SSE) transport.

---

## 🚀 Running Locally

```bash
bun run apps/remote-mcp/src/index.ts
```
*Server will start on `http://localhost:3001`.*

---

## 📡 Endpoints

- `GET /sse` — Establishes persistent Server-Sent Events (SSE) stream for AI coding agents.
- `POST /messages?sessionId=<id>` — Ingests client JSON-RPC messages and routes to active session.
- `GET /health` — Health check endpoint for uptime monitors and load balancers.
- `GET /` — API metadata and active sessions count.

---

## ☁️ Deployment

### 1. Docker
```bash
docker build -t ui-keeper-remote-mcp -f apps/remote-mcp/Dockerfile .
docker run -p 3001:3001 ui-keeper-remote-mcp
```

### 2. Railway / Render / Fly.io
Deploy this repository and set the start command to:
```bash
bun run apps/remote-mcp/src/index.ts
```

---

## 🤖 Connecting AI Clients to Remote MCP

In `mcp.json` / Cursor / OpenCode:
```json
{
  "mcpServers": {
    "ui-keeper-remote": {
      "url": "https://your-deployed-domain.com/sse"
    }
  }
}
```
