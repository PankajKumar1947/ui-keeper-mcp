import { describe, expect, test } from "bun:test";
import appHandler from "../src/index";

describe("Remote MCP Server (Hono + WebStandardStreamableHttp)", () => {
  test("GET / returns status and endpoint list", async () => {
    const res = await appHandler.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.service).toBe("ui-keeper-remote-mcp");
    expect(json.transport).toBe("WebStandardStreamableHTTPServerTransport");
  });

  test("GET /health returns healthy status", async () => {
    const res = await appHandler.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("healthy");
    expect(json.timestamp).toBeDefined();
  });

  test("POST /mcp handles tools/list RPC call", async () => {
    const req = new Request("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-1",
        method: "tools/list",
        params: {},
      }),
    });

    const res = await appHandler.fetch(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.result).toBeDefined();
    expect(json.result.tools).toBeDefined();

    const toolNames = json.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("inspect_design_system");
    expect(toolNames).toContain("inspect_ui");
    expect(toolNames).toContain("audit_ui");
    expect(toolNames).toContain("get_ui_health_score");
    expect(toolNames).toContain("scaffold_component");
    expect(toolNames).toContain("find_component");
    expect(toolNames).toContain("find_design_token");
    expect(toolNames).toContain("apply_ui_fix");
  });

  test("POST /mcp executes find_design_token tool RPC call", async () => {
    const req = new Request("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-2",
        method: "tools/call",
        params: {
          name: "find_design_token",
          arguments: {
            type: "spacing",
            value: "24px",
          },
        },
      }),
    });

    const res = await appHandler.fetch(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.result).toBeDefined();
    expect(json.result.content).toBeDefined();
    const parsedText = JSON.parse(json.result.content[0].text);
    expect(parsedText.searchedValue).toBe("24px");
  });
});
