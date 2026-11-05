import Box from '@mui/material/Box';

import { BAR_GRADIENTS, CARD_RADIUS, pickByIndex, SOFT_BG, SOFT_BORDER } from '../detail-styles';

import type { SxProps, Theme } from '@mui/material/styles';
import type { FC, ReactNode } from 'react';

interface TopBarCardProps {
  /** Position in the list: picks the colour of the top bar */
  index: number;
  /** Padding and inner layout */
  sx: SxProps<Theme>;
  /** Width of the card in a wrapping row (default: the grid cell) */
  width?: string | Partial<Record<'xs' | 'sm' | 'md' | 'lg', string>>;
  children: ReactNode;
}

const BAR_HEIGHT = 6;

/** A soft list card with a coloured gradient bar along its top edge. */
export const TopBarCard: FC<TopBarCardProps> = ({ index, sx, width, children }) => (
  <Box
    component="li"
    sx={{
      position: 'relative',
      width,
      overflow: 'hidden',
      bgcolor: SOFT_BG,
      border: `1px solid ${SOFT_BORDER}`,
      borderRadius: CARD_RADIUS,
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: '0 0 auto 0',
        height: BAR_HEIGHT,
        background: pickByIndex(BAR_GRADIENTS, index),
      },
    }}
  >
    <Box sx={sx}>{children}</Box>
  </Box>
);
