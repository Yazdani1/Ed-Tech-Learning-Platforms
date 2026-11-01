import { DialNumbers } from './DialNumbers';
import { CENTER, INNER_R, KNOB_R, dialTicks, type DialMode } from './duration-dial';
import { CLOCK_DIAL, DIAL_ACCENT } from './schedule.theme';

import type { FC } from 'react';

interface DurationDialFaceProps {
  mode: DialMode;
  selected: number;
  hand: { x: number; y: number };
}

const KNOB_INNER_R = 9;
const RING_GAP = 14;
const CAP_R = 5;
const CAP_INNER_R = 2;

/** The drawing inside the dial's <svg>: face, ticks, hand and numbers (no interaction here). */
export const DurationDialFace: FC<DurationDialFaceProps> = ({ mode, selected, hand }) => (
  <>
    <circle cx={CENTER} cy={CENTER} r={CENTER - 1} fill={CLOCK_DIAL} />
    <circle
      cx={CENTER}
      cy={CENTER}
      r={CENTER - 1}
      fill="none"
      stroke={`${DIAL_ACCENT}44`}
      strokeWidth={1.5}
    />
    {dialTicks.map((tick, index) => (
      <line
        key={index}
        x1={tick.x1}
        y1={tick.y1}
        x2={tick.x2}
        y2={tick.y2}
        stroke={`rgba(255,255,255,${tick.major ? 0.22 : 0.08})`}
        strokeWidth={tick.major ? 1.5 : 1}
      />
    ))}
    {mode === 'hours' && (
      <>
        <circle cx={CENTER} cy={CENTER} r={INNER_R + RING_GAP} fill="rgba(255,255,255,0.025)" />
        <circle cx={CENTER} cy={CENTER} r={INNER_R - RING_GAP} fill={CLOCK_DIAL} />
      </>
    )}
    <line
      x1={CENTER}
      y1={CENTER}
      x2={hand.x}
      y2={hand.y}
      stroke={DIAL_ACCENT}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <circle cx={hand.x} cy={hand.y} r={KNOB_R} fill={DIAL_ACCENT} />
    <circle cx={hand.x} cy={hand.y} r={KNOB_INNER_R} fill="rgba(255,255,255,0.25)" />
    <DialNumbers mode={mode} selected={selected} />
    <circle cx={CENTER} cy={CENTER} r={CAP_R} fill={DIAL_ACCENT} />
    <circle cx={CENTER} cy={CENTER} r={CAP_INNER_R} fill="#fff" />
  </>
);
