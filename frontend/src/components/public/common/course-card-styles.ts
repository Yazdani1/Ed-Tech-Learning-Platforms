// Look of the home / pricing course card: a soft shadow, and on hover a moving gradient border.

const BORDER_WIDTH = '2px';
const BORDER_GRADIENT =
  'linear-gradient(120deg, #2563eb, #7c3aed, #ec4899, #f59e0b, #10b981, #2563eb)';

/** The card itself (the gradient border is its ::before, shown on hover). */
export const COURSE_CARD_SX = {
  position: 'relative',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '20px',
  border: '1px solid #e7ebf1',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '@keyframes courseCardBorderFlow': {
    '0%': { backgroundPosition: '0% 50%' },
    '100%': { backgroundPosition: '300% 50%' },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    padding: BORDER_WIDTH,
    borderRadius: 'inherit',
    background: BORDER_GRADIENT,
    backgroundSize: '300% 100%',
    // Only the ring shows: the content box is cut out of the gradient
    mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    maskComposite: 'exclude',
    WebkitMaskComposite: 'xor',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '& img': { transition: 'transform 0.4s ease' },
  '&:hover, &:focus-within': {
    transform: 'translateY(-6px)',
    boxShadow: '0 20px 44px rgba(37,99,235,0.20), 0 4px 10px rgba(15,23,42,0.08)',
  },
  '&:hover::before, &:focus-within::before': {
    opacity: 1,
    animation: 'courseCardBorderFlow 3s linear infinite',
  },
  '&:hover img': { transform: 'scale(1.05)' },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover, &:focus-within': { transform: 'none' },
    '&:hover::before, &:focus-within::before': { animation: 'none' },
    '&:hover img': { transform: 'none' },
  },
} as const;
