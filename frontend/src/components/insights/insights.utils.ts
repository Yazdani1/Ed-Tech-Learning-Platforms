import { formatBdt } from '@/utils/price';

import type { RevenuePeriodKey } from '@/schemas/insights.schema';

/**
 * Categorical chart colours in a fixed order (validated palette from the data-viz guide): a series keeps its
 * slot, never cycled by rank.
 */
export const SERIES_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948',
] as const;

/** Colour for the n-th category (falls back to the last slot rather than repeating a colour). */
export const seriesColor = (index: number): string =>
  SERIES_COLORS[Math.min(index, SERIES_COLORS.length - 1)] ?? SERIES_COLORS[0];

/** Recessive grid lines. */
export const GRID_COLOR = '#e5e7eb';

/** Height of every chart plot. */
export const CHART_HEIGHT = 280;

/** Rounded data end of bars (top corners only, anchored to the baseline). */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

export const AXIS_TICK = { fontSize: 12 } as const;

/** Money amounts on this platform are in Taka. */
export const formatMoney = (value: number): string => formatBdt(value);

/** The colour of each headline period card (today, last 7 days, this month, all time). */
export const PERIOD_COLORS: Record<RevenuePeriodKey, string> = {
  today: seriesColor(0),
  week: seriesColor(2),
  month: seriesColor(6),
  lifetime: seriesColor(3),
};

/** i18n keys of the period names (insights.periods.*). */
export const PERIOD_LABEL_KEYS: Record<RevenuePeriodKey, string> = {
  today: 'insights.periods.today',
  week: 'insights.periods.week',
  month: 'insights.periods.month',
  lifetime: 'insights.periods.lifetime',
};

/** Course revenue and subscription revenue keep these colours in every chart. */
export const COURSE_REVENUE_COLOR = seriesColor(0);
export const SUBSCRIPTION_REVENUE_COLOR = seriesColor(1);
export const ENROLLMENT_COLOR = seriesColor(2);
