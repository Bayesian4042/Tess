import { z } from "zod";

export const emailParserSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
});

export type EmailParserInput = z.infer<typeof emailParserSchema>;

export const emailParserResponse = z.object({
  success: z.boolean(),
  data: z.object({
    skills: z.array(z.string()),
    experienceYears: z.number(),
    employmentType: z.string(),
    rawContent: z.string(),
  }).optional(),
  error: z.string().optional(),
});

export type EmailParserResponse = z.infer<typeof emailParserResponse>;
