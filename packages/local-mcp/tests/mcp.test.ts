import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server";

describe("UI Keeper Local MCP Server", () => {
  test("lists all available UI Keeper tools", async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t) => t.name);

    expect(toolNames).toContain("inspect_design_system");
    expect(toolNames).toContain("inspect_ui");
    expect(toolNames).toContain("audit_ui");
    expect(toolNames).toContain("find_component");
    expect(toolNames).toContain("find_design_token");

    await client.close();
    await server.close();
  });

  test("executes find_design_token tool accurately", async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "find_design_token",
      arguments: {
        type: "spacing",
        value: "16px",
      },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);

    const parsed = JSON.parse(content[0].text);
    expect(parsed).toHaveProperty("searchedValue", "16px");

    await client.close();
    await server.close();
  });
});
