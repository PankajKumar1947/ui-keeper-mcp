import { z } from "zod";

export const HealthGradeSchema = z.enum(["A+", "A", "B", "C", "D", "F"]);

export const HealthScoreSchema = z.object({
  overallScore: z.number(),
  grade: HealthGradeSchema,
  tokenAdoptionScore: z.number(),
  componentReuseScore: z.number(),
  cleanlinessScore: z.number(),
  totalIssues: z.number(),
  errorsCount: z.number(),
  warningsCount: z.number(),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type HealthScore = z.infer<typeof HealthScoreSchema>;
export type HealthGrade = z.infer<typeof HealthGradeSchema>;
