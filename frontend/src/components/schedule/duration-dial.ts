// Geometry of the duration dial (an SVG clock face: hours on two rings, minutes/seconds on one).
import type { DurationValue } from '@/schemas/schedule.schema';

export type DialMode = 'hours' | 'minutes' | 'seconds';

export const DIAL_SIZE = 268;
export const CENTER = DIAL_SIZE / 2;
export const OUTER_R = 104;
export const INNER_R = 68;
/** Radius of the hand knob and of the selected number's circle */
export const KNOB_R = 15;

const FULL_TURN = 360;
const HALF_TURN = 180;
const POSITIONS = 12;
const STEP_DEG = FULL_TURN / POSITIONS;
const TICKS = 60;
const MAJOR_EVERY = 5;
const MINUTE_STEP_DEG = FULL_TURN / TICKS;
const MAX_HOURS = 23;
const PAD = 2;

export const MAX_VALUE: Record<DialMode, number> = { hours: MAX_HOURS, minutes: 59, seconds: 59 };

export const pad2 = (value: number): string => String(value).padStart(PAD, '0');

export const toXY = (angleDeg: number, radius: number): { x: number; y: number } => ({
  x: CENTER + radius * Math.sin((angleDeg * Math.PI) / HALF_TURN),
  y: CENTER - radius * Math.cos((angleDeg * Math.PI) / HALF_TURN),
});

export interface DialNumber {
  label: string;
  value: number;
  inner: boolean;
  angle: number;
}

/** Hours: 1-12 outside, 0 and 13-23 inside. Minutes/seconds: 00, 05 ... 55. */
export const dialNumbers = (mode: DialMode): DialNumber[] => {
  const slots = Array.from({ length: POSITIONS }, (_, index) => index);
  if (mode !== 'hours') {
    return slots.map((index) => ({
      label: pad2(index * MAJOR_EVERY),
      value: index * MAJOR_EVERY,
      inner: false,
      angle: index * STEP_DEG,
    }));
  }
  return slots.flatMap((index) => {
    const outer = index === 0 ? POSITIONS : index;
    const inner = index === 0 ? 0 : index + POSITIONS;
    return [
      { label: String(outer), value: outer, inner: false, angle: index * STEP_DEG },
      { label: String(inner), value: inner, inner: true, angle: index * STEP_DEG },
    ];
  });
};

export interface DialTick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
}

const TICK_OUTER_GAP = 5;
const MAJOR_LENGTH = 15;
const MINOR_LENGTH = 9;

export const dialTicks: readonly DialTick[] = Array.from({ length: TICKS }, (_, index) => {
  const angle = index * MINUTE_STEP_DEG;
  const major = index % MAJOR_EVERY === 0;
  const from = toXY(angle, CENTER - TICK_OUTER_GAP);
  const to = toXY(angle, CENTER - (major ? MAJOR_LENGTH : MINOR_LENGTH));
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, major };
});

export const valueOf = (value: DurationValue, mode: DialMode): number => value[mode];

/** Where the hand points for the current value. */
export const handPosition = (value: DurationValue, mode: DialMode): { x: number; y: number } => {
  if (mode === 'hours') {
    const hours = value.hours;
    const inner = hours === 0 || hours > POSITIONS;
    return toXY(hours === 0 ? 0 : (hours % POSITIONS) * STEP_DEG, inner ? INNER_R : OUTER_R);
  }
  return toXY(valueOf(value, mode) * MINUTE_STEP_DEG, OUTER_R);
};

/** The value under a click at (x, y) relative to the dial centre (in dial units). */
export const valueAt = (mode: DialMode, x: number, y: number): number => {
  const angle = ((Math.atan2(x, -y) * HALF_TURN) / Math.PI + FULL_TURN) % FULL_TURN;
  if (mode !== 'hours') return Math.round(angle / MINUTE_STEP_DEG) % TICKS;
  const position = Math.round(angle / STEP_DEG) % POSITIONS;
  const inner = Math.hypot(x, y) < (OUTER_R + INNER_R) / 2;
  if (inner) return position === 0 ? 0 : position + POSITIONS;
  return position === 0 ? POSITIONS : position;
};

/** Arrow keys: one step up or down, wrapping around. */
export const stepValue = (mode: DialMode, current: number, step: number): number => {
  const size = MAX_VALUE[mode] + 1;
  return (current + step + size) % size;
};

/** viewBox of the dial */
export const DIAL_VIEWBOX = `0 0 ${DIAL_SIZE} ${DIAL_SIZE}`;
