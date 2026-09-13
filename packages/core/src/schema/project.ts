import { z } from "zod";
import { FrameworkTypeSchema, StylingEngineSchema, DesignSystemSchema } from "./design-system";
import { ComponentCatalogSchema } from "./component";

export const RouteTypeSchema = z.enum(["page", "layout", "api", "component"]);

export const RouteEntrySchema = z.object({
  path: z.string(),
  filePath: z.string(),
  type: RouteTypeSchema.default("page"),
  dynamic: z.boolean().default(false),
});

export const ProjectConfigSchema = z.object({
  rootDir: z.string(),
  framework: FrameworkTypeSchema.default("unknown"),
  stylingEngine: StylingEngineSchema.default("unknown"),
  srcDir: z.string().default("src"),
  componentsDir: z.string().optional(),
  routesDir: z.string().optional(),
  tailwindConfigPath: z.string().optional(),
  globalCssPaths: z.array(z.string()).default([]),
});

export const ProjectModelSchema = z.object({
  config: ProjectConfigSchema,
  designSystem: DesignSystemSchema,
  componentCatalog: ComponentCatalogSchema,
  routes: z.array(RouteEntrySchema).default([]),
});
