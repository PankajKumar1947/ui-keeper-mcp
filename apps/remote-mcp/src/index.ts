import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer as createMcpServer } from "@ui-keeper/local-mcp";

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Active SSE client sessions
const sessions = new Map<string, SSEServerTransport>();

// 1. Root & Health Check Endpoints
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "ui-keeper-remote-mcp",
    framework: "hono",
    version: "0.1.0",
    activeSessions: sessions.size,
    endpoints: {
      sse: "/sse",
      messages: "/messages",
      health: "/health",
    },
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
  });
});

// 2. Server-Sent Events (SSE) Stream Endpoint
app.get("/sse", async (c) => {
  const res = (c.env as any)?.outgoing;

  if (!res) {
    return c.text("Node server response adapter required for SSE transport", 500);
  }

  const mcpServer = createMcpServer();
  const transport = new SSEServerTransport("/messages", res);

  sessions.set(transport.sessionId, transport);

  transport.onclose = () => {
    sessions.delete(transport.sessionId);
  };

  await mcpServer.connect(transport);
  return new Response(null, { status: 200 });
});

// 3. Message Receiver Endpoint
app.post("/messages", async (c) => {
  const sessionId = c.req.query("sessionId");
  if (!sessionId) {
    return c.text("Missing sessionId query parameter", 400);
  }

  const transport = sessions.get(sessionId);
  if (!transport) {
    return c.text(`Session not found: ${sessionId}`, 404);
  }

  const req = (c.env as any)?.incoming;
  const res = (c.env as any)?.outgoing;

  if (!req || !res) {
    return c.text("Node server adapter required for post message handling", 500);
  }

  await transport.handlePostMessage(req, res);
  return new Response(null, { status: 200 });
});

export function startServer(port = PORT, host = HOST) {
  return serve(
    {
      fetch: app.fetch,
      port,
      hostname: host,
    },
    (info) => {
      console.log(`\n🚀 UI Keeper Remote MCP Server (Hono) running at http://${host}:${port}`);
      console.log(`   • SSE Endpoint:      http://${host}:${port}/sse`);
      console.log(`   • Message Endpoint:  http://${host}:${port}/messages`);
      console.log(`   • Health Check:      http://${host}:${port}/health\n`);
    }
  );
}

// Auto-start if executed directly as entrypoint
if (import.meta.main) {
  startServer();
}

export { app };
