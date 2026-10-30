import { z } from 'zod';

import { taxonomySchema, type Taxonomy, type TaxonomyKind } from './catalog.schema';

/** Which list the course setup screen manages: categories or course types (same shape, same rules). */
export type SetupKind = TaxonomyKind;

/** A category or course type (GET/POST/PUT /api/categories and /api/course-types): the shared shape. */
export const setupItemSchema = taxonomySchema;
export type SetupItem = Taxonomy;

/** Same bound the form uses for the description (the backend stores any length; this keeps it short). */
export const SETUP_DESCRIPTION_MAX = 500;
export const SETUP_NAME_MAX = 120;

/** POST/PUT body. Messages are i18n keys; the form translates them. */
export const setupItemRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(SETUP_NAME_MAX, 'showcase.setup.nameTooLong')
    .regex(/[\p{L}\p{N}]/u, 'showcase.setup.nameNeedsLetters'),
  description: z.string().trim().max(SETUP_DESCRIPTION_MAX, 'showcase.setup.descriptionTooLong'),
});
export type SetupItemRequest = z.infer<typeof setupItemRequestSchema>;
