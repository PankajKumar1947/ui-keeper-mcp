import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { analyzeProject, auditProject, fixProject, colorDistance } from "@ui-keeper/core";

export function createServer() {
  const server = new Server(
    {
      name: "ui-keeper",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "inspect_design_system",
          description:
            "Extract and inspect the design system tokens (colors, spacing scale, typography, radius, shadows, breakpoints) for the project.",
          inputSchema: {
            type: "object",
            properties: {
              rootDir: {
                type: "string",
                description: "Optional project root directory (defaults to current directory).",
              },
            },
          },
        },
        {
          name: "inspect_ui",
          description:
            "Inspect the complete UI model of the project, including framework, styling engine, tokens, component catalog, and routes.",
          inputSchema: {
            type: "object",
            properties: {
              rootDir: {
                type: "string",
                description: "Optional project root directory.",
              },
            },
          },
        },
        {
          name: "audit_ui",
          description:
            "Audit a file or project against the design system to detect style drift, hardcoded colors/spacing, and duplicate components.",
          inputSchema: {
            type: "object",
            properties: {
              rootDir: {
                type: "string",
                description: "Project root directory.",
              },
              targetPath: {
                type: "string",
                description: "Optional specific file or directory path to audit.",
              },
            },
          },
        },
        {
          name: "find_component",
          description:
            "Search existing UI components in the project catalog by name or category to prevent duplicate implementations.",
          inputSchema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "Search keyword (e.g. 'button', 'card', 'modal', 'input').",
              },
              category: {
                type: "string",
                description: "Optional component category filter.",
              },
              rootDir: {
                type: "string",
                description: "Project root directory.",
              },
            },
          },
        },
        {
          name: "find_design_token",
          description:
            "Find the matching or closest design system token for a specific color (hex/rgb), spacing, or radius.",
          inputSchema: {
            type: "object",
            required: ["type", "value"],
            properties: {
              type: {
                type: "string",
                enum: ["color", "spacing", "radius"],
                description: "Token category type.",
              },
              value: {
                type: "string",
                description: "The raw value to search for (e.g. '#1e293b' or '16px').",
              },
              rootDir: {
                type: "string",
                description: "Project root directory.",
              },
            },
          },
        },
        {
          name: "apply_ui_fix",
          description:
            "Apply high-confidence automated fixes to UI issues and verify them using the verification loop.",
          inputSchema: {
            type: "object",
            properties: {
              rootDir: {
                type: "string",
                description: "Project root directory.",
              },
              targetPath: {
                type: "string",
                description: "Optional file or directory to fix.",
              },
            },
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const rootDir = (args.rootDir as string) || process.cwd();

    try {
      if (name === "inspect_design_system") {
        const model = analyzeProject({ rootDir });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(model.designSystem, null, 2),
            },
          ],
        };
      }

      if (name === "inspect_ui") {
        const model = analyzeProject({ rootDir });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(model, null, 2),
            },
          ],
        };
      }

      if (name === "audit_ui") {
        const report = auditProject({
          rootDir,
          targetPath: args.targetPath as string | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      }

      if (name === "apply_ui_fix") {
        const result = fixProject({
          rootDir,
          targetPath: args.targetPath as string | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "find_component") {
        const model = analyzeProject({ rootDir });
        const query = (args.query as string).toLowerCase();
        const category = args.category ? (args.category as string).toLowerCase() : undefined;

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

      if (name === "find_design_token") {
        const model = analyzeProject({ rootDir });
        const type = args.type as "color" | "spacing" | "radius";
        const val = args.value as string;

        if (type === "color") {
          let closest: { token: any; distance: number } | null = null;
          for (const token of model.designSystem.colors) {
            if (!token.hex) continue;
            const dist = colorDistance(val, token.hex);
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
                    searchedValue: val,
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
        } else if (type === "spacing") {
          const pxVal = parseFloat(val);
          const match = model.designSystem.spacing.find(
            (s) => s.value === val || s.pxValue === pxVal || s.name === val
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    searchedValue: val,
                    match: match || null,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else if (type === "radius") {
          const match = model.designSystem.radius.find(
            (r) => r.value === val || r.name === val
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    searchedValue: val,
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

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error executing tool ${name}: ${error.message || String(error)}`,
          },
        ],
      };
    }
  });

  return server;
}
