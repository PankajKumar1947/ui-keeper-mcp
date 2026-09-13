import { describe, expect, test } from "bun:test";
import { app } from "../src/index";

describe("Hono Remote MCP Server", () => {
  test("GET / returns status ok and service metadata", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.framework).toBe("hono");
    expect(data.service).toBe("ui-keeper-remote-mcp");
    expect(data.endpoints).toHaveProperty("sse", "/sse");
  });

  test("GET /health returns healthy status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data).toHaveProperty("activeSessions");
  });

  test("POST /messages returns 400 when sessionId is missing", async () => {
    const res = await app.request("/messages", { method: "POST" });
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("Missing sessionId");
  });
});
