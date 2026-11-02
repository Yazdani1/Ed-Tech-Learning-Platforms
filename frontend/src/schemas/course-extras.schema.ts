import { z } from 'zod';

import { toolSchema } from './tools.schema';

// The course page sections edited in the course editor (PATCH /api/courses/:id/extras) and shown on the
// course page: tools, "What you get", projects, "Who this course is for", success stories and FAQ.

/** An image uploaded with POST /api/courses/:id/images. */
export const courseImageSchema = z.object({ url: z.string(), publicId: z.string() });
export type CourseImage = z.infer<typeof courseImageSchema>;

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const image = courseImageSchema.nullish().transform((value) => value ?? null);

export const toolsSectionSchema = z.object({
  title: text,
  description: text,
  /** Populated tools; a deleted tool comes back as null and is dropped */
  tools: z
    .array(toolSchema.nullable())
    .catch([])
    .transform((tools) => tools.filter((tool) => tool !== null)),
});
export type ToolsSection = z.infer<typeof toolsSectionSchema>;

export const benefitSchema = z.object({ title: z.string(), description: text, icon: image });
export type Benefit = z.infer<typeof benefitSchema>;

export const benefitsSectionSchema = z.object({
  title: text,
  description: text,
  items: z.array(benefitSchema).catch([]),
});
export type BenefitsSection = z.infer<typeof benefitsSectionSchema>;

export const projectSchema = z.object({
  title: z.string(),
  description: text,
  images: z.array(courseImageSchema).catch([]),
  liveDemoUrl: text,
  videoUrl: text,
});
export type CourseProject = z.infer<typeof projectSchema>;

export const successStorySchema = z.object({
  title: z.string(),
  description: text,
  companyName: text,
  photo: image,
  companyLogo: image,
});
export type SuccessStory = z.infer<typeof successStorySchema>;

export const faqSchema = z.object({ question: z.string(), answer: z.string() });
export type CourseFaq = z.infer<typeof faqSchema>;

const EMPTY_TOOLS: ToolsSection = { title: '', description: '', tools: [] };
const EMPTY_BENEFITS: BenefitsSection = { title: '', description: '', items: [] };

/** The section fields of GET /api/courses/:id (also the response of PATCH .../extras). */
export const courseExtrasFields = {
  toolsSection: toolsSectionSchema.nullish().transform((value) => value ?? EMPTY_TOOLS),
  benefitsSection: benefitsSectionSchema.nullish().transform((value) => value ?? EMPTY_BENEFITS),
  projects: z.array(projectSchema).catch([]),
  audience: z.array(z.string()).catch([]),
  successStories: z.array(successStorySchema).catch([]),
  faqs: z.array(faqSchema).catch([]),
};
export const courseExtrasSchema = z.object(courseExtrasFields);
export type CourseExtras = z.infer<typeof courseExtrasSchema>;

// ---- Requests: each section is replaced as a whole; images go as { url, publicId } ----

export interface CourseExtrasPatch {
  toolsSection?: { title: string; description: string; tools: string[] };
  benefitsSection?: BenefitsSection;
  projects?: CourseProject[];
  audience?: string[];
  successStories?: SuccessStory[];
  faqs?: CourseFaq[];
}

// ---- Forms (messages are i18n keys) ----

const TITLE_MAX = 150;
const TEXT_MAX = 2000;
const URL_MAX = 500;

const requiredTitle = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .max(TITLE_MAX, 'catalog.extras.tooLong');
const optionalText = z.string().trim().max(TEXT_MAX, 'catalog.extras.tooLong');
const optionalUrl = z
  .string()
  .trim()
  .max(URL_MAX, 'catalog.extras.tooLong')
  .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), 'catalog.extras.badUrl');

export const projectFormSchema = z.object({
  title: requiredTitle,
  description: optionalText,
  liveDemoUrl: optionalUrl,
  videoUrl: optionalUrl,
});
export type ProjectForm = z.infer<typeof projectFormSchema>;

export const successStoryFormSchema = z.object({
  title: requiredTitle,
  description: optionalText,
  companyName: z.string().trim().max(TITLE_MAX, 'catalog.extras.tooLong'),
});
export type SuccessStoryForm = z.infer<typeof successStoryFormSchema>;

export const faqFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(TITLE_MAX * 2, 'catalog.extras.tooLong'),
  answer: z.string().trim().min(1, 'validation.required').max(TEXT_MAX, 'catalog.extras.tooLong'),
});
export type FaqForm = z.infer<typeof faqFormSchema>;

/** Limits the backend enforces (lists of at most 30 items, 50 FAQs, 10 screenshots per project). */
export const EXTRAS_MAX_ITEMS = 30;
export const EXTRAS_MAX_FAQS = 50;
export const PROJECT_MAX_IMAGES = 10;
