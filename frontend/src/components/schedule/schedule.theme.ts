// Colours of the "digital clock" look of the old study schedule page (dark face, glowing digits).

export const CLOCK_FACE = 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)';
export const CLOCK_DIAL = '#0d1117';
export const CLOCK_FONT = '"Courier New", Courier, monospace';
export const UNIT_LABEL_COLOR = 'rgba(255,255,255,0.45)';

export interface ClockTone {
  digits: string;
  glow: string;
  border: string;
  bar: string;
}

export const RUNNING_TONE: ClockTone = {
  digits: '#00e676',
  glow: 'rgba(0,230,118,0.35)',
  border: 'rgba(0,230,118,0.2)',
  bar: 'linear-gradient(90deg,#00e676,#00bcd4)',
};

export const DONE_TONE: ClockTone = {
  digits: '#ff4d4d',
  glow: 'rgba(255,77,77,0.5)',
  border: 'rgba(255,77,77,0.25)',
  bar: 'linear-gradient(90deg,#f44336,#e91e63)',
};

/** Accent of the duration dial */
export const DIAL_ACCENT = '#2196f3';
export const DIAL_ACCENT_HOVER = '#1976d2';
