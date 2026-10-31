import { z } from 'zod';

import { PASSWORD_MIN_LENGTH, userSchema } from './auth.schema';

/** Same limits as auth.controller updateMe (bcrypt only reads the first 72 bytes). */
export const PASSWORD_MAX_LENGTH = 72;
/** Same as the backend's `upload` middleware (images up to 5 MB). */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/** User.activeSubscription (a nested object: missing or partly empty when there is no plan). */
export const activeSubscriptionSchema = z.object({
  plan: z.string().optional(),
  billingLabel: z.string().nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
});
export type ActiveSubscription = z.infer<typeof activeSubscriptionSchema>;

/** GET/PUT /api/auth/me with the profile fields (the shared userSchema keeps only what the shell needs). */
export const profileSchema = userSchema.extend({
  avatar: z
    .string()
    .nullish()
    .transform((value) => value ?? undefined),
  isCommunityProfilePrivate: z.boolean().catch(false),
  activeSubscription: activeSubscriptionSchema.nullish(),
  purchasedCourses: z.array(z.string()).catch([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Profile = z.infer<typeof profileSchema>;

/** The edit form (validation messages are i18n keys). */
export interface ProfileFormValues {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isCommunityProfilePrivate: boolean;
}

const isEmail = (value: string): boolean => z.email().safeParse(value).success;

/**
 * Form rules matching PUT /api/auth/me: name required; a student who changes the email, and anyone who sets a
 * new password, must give the current password; new password 6-72 characters and confirmed.
 */
/** The edit form schema: ProfileFormValues in and out, with the cross-field rules below. */
export type ProfileFormSchema = z.ZodType<ProfileFormValues, ProfileFormValues>;

export const makeProfileFormSchema = (
  originalEmail: string,
  canChangeEmail: boolean,
): ProfileFormSchema =>
  z
    .object({
      name: z.string().trim().min(1, 'validation.required'),
      email: z.string().trim(),
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
      isCommunityProfilePrivate: z.boolean(),
    })
    .superRefine((values, ctx) => {
      const emailChanged =
        canChangeEmail && values.email.toLowerCase() !== originalEmail.toLowerCase();
      if (canChangeEmail && !values.email) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'validation.required' });
      } else if (emailChanged && !isEmail(values.email)) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'validation.email' });
      }
      const changingPassword = values.newPassword !== '' || values.confirmPassword !== '';
      if ((changingPassword || emailChanged) && !values.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['currentPassword'],
          message: 'profile.currentPasswordRequired',
        });
      }
      if (!changingPassword) return;
      if (
        values.newPassword.length < PASSWORD_MIN_LENGTH ||
        values.newPassword.length > PASSWORD_MAX_LENGTH
      ) {
        ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'profile.passwordLength' });
      }
      if (values.newPassword !== values.confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'profile.passwordMismatch',
        });
      }
    });
