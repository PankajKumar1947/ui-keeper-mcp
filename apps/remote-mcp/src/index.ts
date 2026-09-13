import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  analyzeProject,
  auditProject,
  fixProject,
  generateComponent,
  calculateHealthScore,
  colorDistance,
  InspectDesignSystemInputSchema,
  InspectUiInputSchema,
  AuditUiInputSchema,
  GetUiHealthScoreInputSchema,
  ScaffoldComponentInputSchema,
  FindComponentInputSchema,
  FindDesignTokenInputSchema,
  ApplyUiFixInputSchema,
} from "@ui-keeper/core";

export function createMcpServer() {
  const server = new McpServer({
    name: "ui-keeper-remote-mcp",
    version: "0.1.0",
    description: "Remote Streamable MCP server for UI Keeper",
  });

  // Tool 1: inspect_design_system
  server.registerTool(
    "inspect_design_system",
    {
      title: "Inspect Design System",
      description:
        "Extract and inspect the design system tokens (colors, spacing scale, typography, radius, shadows, breakpoints) for the project.",
      inputSchema: InspectDesignSystemInputSchema.shape,
    },
    async (input) => {

      const rootDir = input.rootDir || process.cwd();
      const model = analyzeProject({ rootDir });
      return {
        content: [{ type: "text", text: JSON.stringify(model.designSystem, null, 2) }],
      };
    }
  );

  // Tool 2: inspect_ui
  server.registerTool(
    "inspect_ui",
    {
      title: "Inspect UI Model",
      description:
        "Inspect the complete UI model of the project, including framework, styling engine, tokens, component catalog, and routes.",
      inputSchema: InspectUiInputSchema.shape,
    },
    async (input) => {
      const rootDir = input.rootDir || process.cwd();
      const model = analyzeProject({ rootDir });
      return {
        content: [{ type: "text", text: JSON.stringify(model, null, 2) }],
      };
    }
  );

  // Tool 3: audit_ui
  server.registerTool(
    "audit_ui",
    {
      title: "Audit UI",
      description:
        "Audit a file or project against the design system to detect style drift, hardcoded colors/spacing, class conflicts, contrast issues, and duplicate components.",
      inputSchema: AuditUiInputSchema.shape,
    },
    async (input) => {
      const rootDir = input.rootDir || process.cwd();
      const report = auditProject({
        rootDir,
        targetPath: input.targetPath,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    }
  );

  // Tool 4: get_ui_health_score
  server.registerTool(
    "get_ui_health_score",
    {
      title: "Get UI Health Score",
      description:
        "Calculate a comprehensive 0-100% UI Quality and Design System Health score with letter grade and recommendations.",
      inputSchema: GetUiHealthScoreInputSchema.shape,
    },
    async (input) => {
      const rootDir = input.rootDir || process.cwd();
      const health = calculateHealthScore({
        rootDir,
        targetPath: input.targetPath,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(health, null, 2) }],
      };
    }
  );

  // Tool 5: scaffold_component
  server.registerTool(
    "scaffold_component",
    {
      title: "Scaffold Component",
      description:
        "Generate a production-ready, type-safe, token-compliant React component file (e.g. Card, Badge, Stat, Section).",
      inputSchema: ScaffoldComponentInputSchema.shape,
    },
    async (input) => {
      const rootDir = input.rootDir || process.cwd();
      const comp = generateComponent({
        rootDir,
        name: input.name,
        category: input.category as any,
        writeToFile: !!input.writeToFile,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(comp, null, 2) }],
      };
    }
  );

  // Tool 6: find_component
  server.registerTool(
    "find_component",
    {
      title: "Find Component",
      description:
        "Search existing UI components in the project catalog by name or category to prevent duplicate implementations.",
      inputSchema: FindComponentInputSchema.shape,
    },
    async (input) => {
      const rootDir = input.rootDir || process.cwd();
      const model = analyzeProject({ rootDir });
      const query = input.query.toLowerCase();
      const category = input.category ? input.category.toLowerCase() : undefined;

      const matches = model.componentCatalog.components.filter((c) => {
        const matchQuery =
          c.name.toLowerCase().includes(query) ||
          c.filePath.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query);
        const matchCat = category ? c.category.toLowerCase() === category : true;
        return matchQuery && matchCat;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                found: matches.length,
                components: matches,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool 7: find_design_token
  server.registerTool(
    "find_design_token",
    {
      title: "Find Design Token",
      description:
        "Find the matching or closest design system token for a specific color (hex/rgb), spacing, or radius.",
      inputSchema: FindDesignTokenInputSchema.shape,
    },
    async (input) => {
      const rootDir = input.rootDir || process.cwd();
      const model = analyzeProject({ rootDir });

      if (input.type === "color") {
        let closest: { token: any; distance: number } | null = null;
        for (const token of model.designSystem.colors) {
          if (!token.hex) continue;
          const dist = colorDistance(input.value, token.hex);
          if (dist !== null) {
            if (!closest || dist < closest.distance) {
              closest = { token, distance: dist };
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  searchedValue: input.value,
                  match: closest?.token,
                  distance: closest?.distance,
                  isExactMatch: closest?.distance === 0,
                },
                null,
                2
              ),
            },
          ],
        };
      } else if (input.type === "spacing") {
        const pxVal = parseFloat(input.value);
        const match = model.designSystem.spacing.find(
          (s) => s.value === input.value || s.pxValue === pxVal || s.name === input.value
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  searchedValue: input.value,
                  match: match || null,
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        const match = model.designSystem.radius.find(
          (r) => r.value === input.value || r.name === input.value
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  searchedValue: input.value,
                  match: match || null,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  // Tool 8: apply_ui_fix
  server.registerTool(
    "apply_ui_fix",
    {
      title: "Apply UI Fix",
      description:
        "Apply high-confidence automated fixes to UI issues and verify them using the verification loop.",
      inputSchema: ApplyUiFixInputSchema.shape,
    },
    async (input) => {
      const rootDir = input.rootDir || process.cwd();
      const result = fixProject({
        rootDir,
        targetPath: input.targetPath,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );


  return server;
}

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS", "DELETE", "HEAD"],
    allowHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    exposeHeaders: ["Content-Type"],
  })
);

// 1. Root & Health Check Endpoints
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "ui-keeper-remote-mcp",
    framework: "hono",
    transport: "WebStandardStreamableHTTPServerTransport",
    version: "0.1.0",
    endpoints: {
      mcp: "/mcp",
      health: "/health",
    },
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// 2. Web Standard Streamable HTTP MCP Handler (handles all MCP requests)
app.all("/mcp", async (c) => {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(c.req.raw);
  } finally {
    await server.close();
  }
});

// Also support parameterized path (e.g. /:projectId/mcp)
app.all("/:projectId/mcp", async (c) => {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(c.req.raw);
  } finally {
    await server.close();
  }
});

app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

export { app };
export default app;

