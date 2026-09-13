import { z } from "zod";

export const ComponentCategorySchema = z.enum([
  "button",
  "card",
  "input",
  "modal",
  "dialog",
  "navigation",
  "layout",
  "typography",
  "feedback",
  "table",
  "badge",
  "avatar",
  "other",
]);

export const ComponentPropSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  description: z.string().optional(),
});

export const ComponentVariantSchema = z.object({
  name: z.string(),
  props: z.record(z.string(), z.any()),
  styles: z.string().optional(),
});

export const ComponentEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  filePath: z.string(),
  exportType: z.enum(["default", "named", "both"]).default("named"),
  category: ComponentCategorySchema.default("other"),
  props: z.array(ComponentPropSchema).default([]),
  variants: z.array(ComponentVariantSchema).default([]),
  description: z.string().optional(),
  usageCount: z.number().default(0),
});

export const ComponentCatalogSchema = z.object({
  components: z.array(ComponentEntrySchema).default([]),
  totalCount: z.number().default(0),
  categories: z.record(z.string(), z.number()).optional(),
});
