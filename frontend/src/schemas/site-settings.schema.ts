import { z } from 'zod';

/** Public pages a Super Admin can hide (same keys as the backend's SITE_PAGE_KEYS). */
export const SITE_PAGE_KEYS = [
  'courses',
  'free-courses',
  'pricing',
  'teachers',
  'practice-quiz',
  'community-hub',
] as const;
export const sitePageKeySchema = z.enum(SITE_PAGE_KEYS);
export type SitePageKey = z.infer<typeof sitePageKeySchema>;

export const companyContactSchema = z.object({
  phone: z.string().catch(''),
  whatsapp: z.string().catch(''),
  email: z.string().catch(''),
  address: z.string().catch(''),
});
export type CompanyContact = z.infer<typeof companyContactSchema>;

/** GET /api/site-settings/public (also what both PUTs return). Unknown page keys are dropped. */
export const siteSettingsSchema = z.object({
  hiddenPages: z
    .array(z.string())
    .catch([])
    .transform((pages) =>
      pages.filter((page): page is SitePageKey => sitePageKeySchema.safeParse(page).success),
    ),
  contact: companyContactSchema,
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{5,19}$/;
export const CONTACT_ADDRESS_MAX = 300;

const optionalPhone = z
  .string()
  .trim()
  .refine((value) => value === '' || PHONE_PATTERN.test(value), 'showcase.contact.phoneInvalid');

/** PUT /api/site-settings/contact body (the form). Empty fields clear the value. */
export const companyContactFormSchema = z.object({
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.email().safeParse(value).success, 'validation.email'),
  address: z.string().trim().max(CONTACT_ADDRESS_MAX, 'showcase.contact.addressTooLong'),
});
export type CompanyContactForm = z.infer<typeof companyContactFormSchema>;
