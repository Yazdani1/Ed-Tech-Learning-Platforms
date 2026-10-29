import MenuBook from '@mui/icons-material/MenuBook';
import School from '@mui/icons-material/School';
import TipsAndUpdates from '@mui/icons-material/TipsAndUpdates';
import Box from '@mui/material/Box';

import type { FC } from 'react';

type Corner = 'topLeft' | 'bottomLeft' | 'bottomRight';

interface AuthCornerArtProps {
  position: Corner;
}

const PLACEMENT = {
  topLeft: { top: { xs: 82, md: 96 }, left: { xs: 12, md: 28 } },
  bottomLeft: { bottom: { xs: 16, md: 32 }, left: { xs: 12, md: 36 } },
  bottomRight: { bottom: { xs: 16, md: 34 }, right: { xs: 12, md: 38 } },
} as const;

const ICONS = { topLeft: MenuBook, bottomLeft: School, bottomRight: TipsAndUpdates } as const;

const FLOAT_KEYFRAMES = {
  '@keyframes topLeftFloat': {
    '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
    '50%': { transform: 'translate3d(8px, 10px, 0)' },
  },
  '@keyframes bottomLeftFloat': {
    '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
    '50%': { transform: 'translate3d(10px, -8px, 0)' },
  },
  '@keyframes bottomRightFloat': {
    '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
    '50%': { transform: 'translate3d(-10px, -8px, 0)' },
  },
};

const glowSx = (isRight: boolean) => ({
  position: 'absolute',
  inset: -26,
  borderRadius: '50%',
  background: isRight
    ? 'radial-gradient(circle, rgba(124,58,237,0.22), rgba(14,165,233,0.08) 46%, transparent 68%)'
    : 'radial-gradient(circle, rgba(20,184,166,0.2), rgba(21,101,192,0.1) 48%, transparent 70%)',
  filter: 'blur(10px)',
  animation: 'authGlowPulse 4.8s ease-in-out infinite',
  '@keyframes authGlowPulse': {
    '0%, 100%': { opacity: 0.65, transform: 'scale(0.94)' },
    '50%': { opacity: 1, transform: 'scale(1.08)' },
  },
});

const frameSx = (isRight: boolean, inset: number, dashed: boolean) => ({
  position: 'absolute',
  inset,
  border: dashed ? '1px dashed' : '1px solid',
  borderColor: 'primary.main',
  borderRadius: 1,
  transform: `rotate(${(isRight ? 1 : -1) * (dashed ? -7 : 8)}deg)`,
});

const badgeSx = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: 54, md: 66 },
  height: { xs: 54, md: 66 },
  borderRadius: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'background.paper',
  color: 'primary.main',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 14px 34px rgba(15,23,42,0.08)',
} as const;

/** Decorative floating icon frames in the corners of the auth pages (hidden on phones). */
export const AuthCornerArt: FC<AuthCornerArtProps> = ({ position }) => {
  const Icon = ICONS[position];
  const isRight = position === 'bottomRight';
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        ...PLACEMENT[position],
        width: { xs: 118, md: 156 },
        height: { xs: 118, md: 156 },
        pointerEvents: 'none',
        opacity: { xs: 0.28, md: 0.42 },
        display: { xs: 'none', sm: 'block' },
        animation: `${position}Float 7s ease-in-out infinite`,
        ...FLOAT_KEYFRAMES,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      <Box sx={glowSx(isRight)} />
      <Box sx={frameSx(isRight, 0, false)} />
      <Box sx={frameSx(isRight, 18, true)} />
      <Box sx={badgeSx}>
        <Icon sx={{ fontSize: { xs: 28, md: 34 } }} />
      </Box>
    </Box>
  );
};
