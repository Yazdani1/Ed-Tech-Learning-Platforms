import type { EnrollmentType } from '@/schemas/catalog.schema';

/** Chip colour per enrolment type (same as the old client). */
export const ENROLLMENT_TYPE_COLOR: Record<EnrollmentType, 'success' | 'primary' | 'secondary'> = {
  free: 'success',
  paid: 'primary',
  subscription: 'secondary',
};

/** Enrolment ids are shown small and monospaced. */
export const MONO_SX = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: 'text.secondary',
  overflowWrap: 'anywhere',
} as const;

/** Amounts are shown in green (as in the old client). */
export const MONEY_COLOR = 'success.main';
