import { toDateInput } from '@/utils/dateTime';

import type { BillingOption, SubscriptionPlan } from '@/schemas/catalog.schema';
import type {
  PlanForm,
  PlanRequest,
  SubscriptionRecord,
  SubscriptionStatus,
} from '@/schemas/people.schema';

/** Accent colours of the well-known plans (a plan's own colour wins). */
const PLAN_COLORS: Record<string, string> = {
  Basic: '#0284c7',
  Premium: '#7c3aed',
  Gold: '#d97706',
  'Quiz Only': '#059669',
};
const DEFAULT_PLAN_COLOR = '#1976d2';
const HEX_COLOR = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;

/** Only a real hex colour from the plan is used in styles. */
export const planColor = (plan: string, color?: string | null): string =>
  color && HEX_COLOR.test(color) ? color : (PLAN_COLORS[plan] ?? DEFAULT_PLAN_COLOR);

/** The plan's billing options (old plans with only price + duration become one option). */
export const getBillingOptions = (plan: SubscriptionPlan): BillingOption[] =>
  plan.billingOptions.length > 0
    ? plan.billingOptions
    : [{ label: '', duration: plan.duration, price: plan.price }];

/** Every distinct billing duration across the plans, shortest first (member filter). */
export const billingDurations = (plans: SubscriptionPlan[]): BillingOption[] =>
  Array.from(
    new Map(
      plans.flatMap(getBillingOptions).map((option) => [option.duration, option] as const),
    ).values(),
  ).sort((a, b) => a.duration - b.duration);

/** Cancelled stays cancelled; an active record past its end date shows as expired. */
export const effectiveStatus = (
  record: SubscriptionRecord,
  now = Date.now(),
): SubscriptionStatus => {
  if (record.status === 'Cancelled') return 'Cancelled';
  if (record.status === 'Expired' || new Date(record.endDate).getTime() <= now) return 'Expired';
  return 'Active';
};

export const STATUS_COLOR: Record<SubscriptionStatus, 'success' | 'error' | 'warning'> = {
  Active: 'success',
  Cancelled: 'error',
  Expired: 'warning',
};

export const STATUS_KEY: Record<SubscriptionStatus, string> = {
  Active: 'active',
  Cancelled: 'cancelled',
  Expired: 'expired',
};

export const EMPTY_PLAN_FORM: PlanForm = {
  plan: '',
  billingOptions: [{ label: 'Monthly', duration: '1', price: '' }],
  badge: '',
  color: '',
  features: [{ value: '' }],
};

export const toPlanForm = (plan: SubscriptionPlan | undefined): PlanForm =>
  plan
    ? {
        plan: plan.plan,
        billingOptions: getBillingOptions(plan).map((option) => ({
          label: option.label,
          duration: String(option.duration),
          price: String(option.price),
        })),
        badge: plan.badge ?? '',
        color: plan.color ?? '',
        features: plan.features.length
          ? plan.features.map((value) => ({ value }))
          : [{ value: '' }],
      }
    : EMPTY_PLAN_FORM;

export const toPlanRequest = (form: PlanForm): PlanRequest => ({
  plan: form.plan.trim(),
  billingOptions: form.billingOptions.map((option) => ({
    label: option.label.trim(),
    duration: Number(option.duration),
    price: Number(option.price),
  })),
  features: form.features.map((feature) => feature.value.trim()).filter(Boolean),
  ...(form.badge.trim() && { badge: form.badge.trim() }),
  ...(form.color.trim() && { color: form.color.trim() }),
});

/** The first billing duration of a plan, as a form value ('' without a plan). */
export const firstBillingDuration = (plan: SubscriptionPlan | undefined): string =>
  plan ? String(getBillingOptions(plan)[0]?.duration ?? '') : '';

/** True when the ISO date is still ahead of now. */
export const isInFuture = (iso: string | null): iso is string =>
  iso !== null && new Date(iso).getTime() > Date.now();

/** Today as a date input value in the viewer's zone. */
export const todayInput = (): string => toDateInput(new Date());
