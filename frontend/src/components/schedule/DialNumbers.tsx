import { INNER_R, KNOB_R, OUTER_R, dialNumbers, toXY, type DialMode } from './duration-dial';
import { DIAL_ACCENT } from './schedule.theme';

import type { FC } from 'react';

interface DialNumbersProps {
  mode: DialMode;
  selected: number;
}

const NUMBER_STYLE = {
  userSelect: 'none',
  pointerEvents: 'none',
  fontFamily: 'system-ui, sans-serif',
} as const;

/** The numbers around the dial (the selected one on a filled circle). */
export const DialNumbers: FC<DialNumbersProps> = ({ mode, selected }) => (
  <>
    {dialNumbers(mode).map((number) => {
      const position = toXY(number.angle, number.inner ? INNER_R : OUTER_R);
      const isSelected = number.value === selected;
      return (
        <g key={`${number.inner ? 'i' : 'o'}-${number.value}`}>
          {isSelected && <circle cx={position.x} cy={position.y} r={KNOB_R} fill={DIAL_ACCENT} />}
          <text
            x={position.x}
            y={position.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={isSelected ? '#fff' : `rgba(255,255,255,${number.inner ? 0.5 : 0.85})`}
            fontSize={number.inner ? 11 : 13}
            fontWeight={isSelected ? 700 : 400}
            style={NUMBER_STYLE}
          >
            {number.label}
          </text>
        </g>
      );
    })}
  </>
);
