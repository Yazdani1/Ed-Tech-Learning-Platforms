import { z } from 'zod';

/** GET /api/tools items (also what POST/PUT return): a tool taught in courses and its logo. */
export const toolSchema = z.object({
  _id: z.string(),
  name: z.string(),
  logoUrl: z.string(),
});
export type Tool = z.infer<typeof toolSchema>;

export const TOOL_NAME_MAX = 60;

/** The tool form (the logo is picked separately). Messages are i18n keys. */
export const toolFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(TOOL_NAME_MAX, 'showcase.setup.tool.nameTooLong'),
});
export type ToolForm = z.infer<typeof toolFormSchema>;
