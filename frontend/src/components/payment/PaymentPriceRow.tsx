import Box from '@mui/material/Box';

import type { FC, ReactNode } from 'react';

interface PaymentPriceRowProps {
  label: string;
  children: ReactNode;
}

/** One line of the order summary: what it is on the left, the amount on the right. */
export const PaymentPriceRow: FC<PaymentPriceRowProps> = ({ label, children }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Box component="dt" sx={{ color: '#334155' }}>
      {label}
    </Box>
    <Box component="dd" sx={{ m: 0, whiteSpace: 'nowrap' }}>
      {children}
    </Box>
  </Box>
);
