// Colours shared by the course page sections.

export const CARD_RADIUS = '16px';
export const SOFT_BG = '#f8fafc';
export const SOFT_BORDER = '#e7ebf1';

/** The thin coloured bar on top of a card; cards take them in turn. */
export const BAR_GRADIENTS = [
  'linear-gradient(90deg, #10b981, #2dd4bf)',
  'linear-gradient(90deg, #2563eb, #4338ca)',
  'linear-gradient(90deg, #f59e0b, #f97316)',
  'linear-gradient(90deg, #06b6d4, #2563eb)',
  'linear-gradient(90deg, #ef4444, #f59e0b)',
  'linear-gradient(90deg, #7c3aed, #ec4899)',
] as const;

/** Light icon tile + icon colour; cards take them in turn. */
export const TILE_COLORS = [
  { bg: '#d1fae5', fg: '#047857' },
  { bg: '#dbeafe', fg: '#1d4ed8' },
  { bg: '#fef3c7', fg: '#b45309' },
  { bg: '#ede9fe', fg: '#6d28d9' },
  { bg: '#ffe4e6', fg: '#be123c' },
  { bg: '#cffafe', fg: '#0e7490' },
] as const;

/** The item of a colour list for a card's position (the lists are never empty). */
export const pickByIndex = <L extends readonly [unknown, ...unknown[]]>(
  list: L,
  index: number,
): L[number] => list[index % list.length] ?? list[0];

export const ICON_TILE_SX = {
  width: 56,
  height: 56,
  borderRadius: '14px',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
} as const;

/** White card of the left column beside the enrolment card (same look as the full-width sections). */
export const SIDE_CARD_SX = {
  mb: { xs: 3, md: 4 },
  borderRadius: '18px',
  overflow: 'hidden',
  borderColor: SOFT_BORDER,
} as const;
