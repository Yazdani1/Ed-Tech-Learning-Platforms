import { z } from 'zod';

// Change history (backend AuditLog): VAT rate, user role / block, promo on/off, course publish / unpublish,
// announcement edits. Read-only, newest first.

export const AUDIT_ACTIONS = [
  'vat.update',
  'user.role',
  'user.block',
  'user.unblock',
  'promo.toggle',
  'course.unpublish',
  'course.publish',
  'announcement.update',
  'announcement.archive',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const valuesSchema = z.record(z.string(), z.unknown()).nullish().catch(null);

export const auditEntrySchema = z.object({
  _id: z.string(),
  action: z.enum(AUDIT_ACTIONS),
  actor: z
    .object({
      _id: z.string(),
      name: z
        .string()
        .catch('')
        .transform((value) => (value === '' ? undefined : value)),
      role: z.string().nullish(),
      avatar: z.string().nullish(),
    })
    .nullable()
    .catch(null),
  before: valuesSchema,
  after: valuesSchema,
  note: z.string().nullish(),
  createdAt: z.string(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const auditHistorySchema = z.array(auditEntrySchema);

/** A text value from before / after ('' when missing). */
export const auditValue = (values: AuditEntry['before'], key: string): string => {
  const value = values?.[key];
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : '';
};
