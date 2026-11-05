// The "Enroll Now" buttons of the course page draw the eye: after a few seconds a light sweeps across them and
// they nudge, then twice more a few seconds apart. Nothing moves for visitors who ask for reduced motion.

const START_AFTER = '3s';
const EVERY = '5s';
/** Then it stops (moving content should not go on for ever) */
const RUNS = 3;

/** Spread into the sx of an Enroll Now button. */
export const ENROLL_ATTENTION_SX = {
  position: 'relative',
  overflow: 'hidden',
  '@keyframes enrollNudge': {
    '0%, 76%, 100%': { transform: 'translateY(0) scale(1)' },
    '80%': { transform: 'translateY(-2px) scale(1.04)' },
    '84%': { transform: 'translateY(0) scale(0.98)' },
    '88%': { transform: 'translateY(-1px) scale(1.02)' },
  },
  '@keyframes enrollShine': {
    '0%, 70%': { transform: 'translateX(-120%) skewX(-20deg)' },
    '90%, 100%': { transform: 'translateX(320%) skewX(-20deg)' },
  },
  animation: `enrollNudge ${EVERY} ease-in-out ${START_AFTER} ${String(RUNS)}`,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '35%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
    transform: 'translateX(-120%) skewX(-20deg)',
    animation: `enrollShine ${EVERY} ease-in-out ${START_AFTER} ${String(RUNS)}`,
    pointerEvents: 'none',
  },
  '&:hover, &:focus-visible, &:hover::after, &:focus-visible::after': {
    animationPlayState: 'paused',
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    '&::after': { animation: 'none', display: 'none' },
  },
} as const;
