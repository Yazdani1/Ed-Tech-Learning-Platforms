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
  /** White card with a stronger shadow, for sections without a section card */
  elevated?: boolean;
  children: ReactNode;
}

const BAR_HEIGHT = 6;
export const ELEVATED_SHADOW = '0 10px 28px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)';

/** A soft list card with a coloured gradient bar along its top edge. */
export const TopBarCard: FC<TopBarCardProps> = ({
  index,
  sx,
  width,
  elevated = false,
  children,
}) => (
  <Box
    component="li"
    sx={{
      position: 'relative',
      width,
      overflow: 'hidden',
      bgcolor: elevated ? 'common.white' : SOFT_BG,
      border: `1px solid ${SOFT_BORDER}`,
      borderRadius: CARD_RADIUS,
      boxShadow: elevated ? ELEVATED_SHADOW : 'none',
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
