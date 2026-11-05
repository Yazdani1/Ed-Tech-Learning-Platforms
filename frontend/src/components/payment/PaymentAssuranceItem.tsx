import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface PaymentAssuranceItemProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

const ICON_SX = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  bgcolor: 'background.paper',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
} as const;

/** One column of the grey band at the bottom of the payment page. */
export const PaymentAssuranceItem: FC<PaymentAssuranceItemProps> = ({ icon, title, children }) => (
  <Box sx={{ display: 'flex', gap: 1.5 }}>
    <Box sx={ICON_SX} aria-hidden>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#475569' }}>
        {children}
      </Typography>
    </Box>
  </Box>
);
