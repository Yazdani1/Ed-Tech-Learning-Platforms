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
  facebook: z.string().catch(''),
  youtube: z.string().catch(''),
  linkedin: z.string().catch(''),
  instagram: z.string().catch(''),
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
export const SOCIAL_URL_MAX = 300;
/** Social links of the Company Contact page, shown as icons in the footer. */
export const SOCIAL_FIELDS = ['facebook', 'youtube', 'linkedin', 'instagram'] as const;
export type SocialField = (typeof SOCIAL_FIELDS)[number];

/** '' or an https address (the backend takes only https links). */
const optionalHttpsUrl = z
  .string()
  .trim()
  .max(SOCIAL_URL_MAX, 'showcase.contact.linkInvalid')
  .refine(
    (value) => value === '' || /^https:\/\/\S+$/i.test(value),
    'showcase.contact.linkInvalid',
  );

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
  facebook: optionalHttpsUrl,
  youtube: optionalHttpsUrl,
  linkedin: optionalHttpsUrl,
  instagram: optionalHttpsUrl,
});
export type CompanyContactForm = z.infer<typeof companyContactFormSchema>;
