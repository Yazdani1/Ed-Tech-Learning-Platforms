import { formatBdt } from '@/utils/price';

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
