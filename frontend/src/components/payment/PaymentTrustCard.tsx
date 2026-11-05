import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { PAYMENT_CARD_SX } from './payment-methods';

import type { FC, ReactNode } from 'react';

interface PaymentTrustCardProps {
  icon: ReactNode;
  /** Background colour of the icon tile */
  tile: string;
  title: string;
  text: string;
}

const TILE_SX = {
  width: 44,
  height: 44,
  borderRadius: '10px',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
} as const;

/** One promise under the payment form: icon tile, title and a short line. */
export const PaymentTrustCard: FC<PaymentTrustCardProps> = ({ icon, tile, title, text }) => (
  <Box sx={{ ...PAYMENT_CARD_SX, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box sx={{ ...TILE_SX, bgcolor: tile }} aria-hidden>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: '#475569' }}>
        {text}
      </Typography>
    </Box>
  </Box>
);
