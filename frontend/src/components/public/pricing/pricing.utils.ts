import type { BillingOption, Subscription, SubscriptionPlan } from '@/schemas/catalog.schema';
import type { TFunction } from 'i18next';

const MONTHLY = 1;
const YEARLY = 12;
const PERCENT = 100;
/** Accent colours of the old client's default plans; any other plan uses the theme blue. */
const DEFAULT_COLORS: Record<string, string> = {
  Basic: '#0284c7',
  Premium: '#7c3aed',
  Gold: '#d97706',
  'Quiz Only': '#059669',
};
const FALLBACK_COLOR = '#1976d2';
/** Admin-entered colours are used only when they are plain hex colours (#rgb ... #rrggbbaa). */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** The plan's billing options; old plans without any get one from their price and duration. */
export const getBillingOptions = (plan: SubscriptionPlan): BillingOption[] =>
  plan.billingOptions.length > 0
    ? plan.billingOptions
    : [{ label: '', duration: plan.duration, price: plan.price }];

/** "Monthly", "Yearly" or "N months" in the viewer's language. */
export const durationLabel = (duration: number, t: TFunction): string => {
  if (duration === MONTHLY) return t('public.pricing.monthly');
  if (duration === YEARLY) return t('public.pricing.yearly');
  return t('public.pricing.months', { count: duration });
};

/** Every billing period any plan offers, shortest first (the toggle above the plans). */
export const billingPeriods = (plans: SubscriptionPlan[]): number[] =>
  Array.from(new Set(plans.flatMap((plan) => getBillingOptions(plan).map((o) => o.duration)))).sort(
    (a, b) => a - b,
  );

/** The period selected at first: monthly when offered, otherwise the shortest. */
export const defaultPeriod = (periods: number[]): number | null =>
  periods.includes(MONTHLY) ? MONTHLY : (periods[0] ?? null);

export interface SavingsInfo {
  savings: number;
  percent: number;
  monthlyEquivalent: number;
}

/** How much a longer period saves compared with paying monthly (null when it saves nothing). */
export const getSavings = (
  options: BillingOption[],
  selected: BillingOption | undefined,
): SavingsInfo | null => {
  const monthly = options.find((option) => option.duration === MONTHLY);
  if (!monthly || !selected || selected.duration <= MONTHLY) return null;
  const monthlyTotal = monthly.price * selected.duration;
  const savings = monthlyTotal - selected.price;
  if (savings <= 0) return null;
  return {
    savings,
    percent: Math.round((savings / monthlyTotal) * PERCENT),
    monthlyEquivalent: Math.round(selected.price / selected.duration),
  };
};

export const accentColor = (plan: SubscriptionPlan): string => {
  if (plan.color && HEX_COLOR.test(plan.color)) return plan.color;
  return DEFAULT_COLORS[plan.plan] ?? FALLBACK_COLOR;
};

/** The Student's subscription while it is still running (null when none or expired). */
export const runningSubscription = (
  subscription: Subscription | null | undefined,
  now: number,
): Subscription | null =>
  subscription?.status === 'Active' && new Date(subscription.endDate).getTime() > now
    ? subscription
    : null;

/** True when this plan + period is exactly what the Student has now. */
export const isCurrentPlan = (
  subscription: Subscription | null,
  plan: string,
  duration: number | undefined,
): boolean =>
  subscription !== null &&
  duration !== undefined &&
  subscription.plan === plan &&
  (!subscription.billingDuration || subscription.billingDuration === duration);
