import Box from '@mui/material/Box';

import { DiscountBanner } from './layout/DiscountBanner';
import { PublicFooter } from './layout/PublicFooter';
import { PublicNavbar } from './layout/PublicNavbar';

import type { FC, ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

/** Shell of the public pages: discount banner, sticky navbar, the page itself, footer. */
export const PublicLayout: FC<PublicLayoutProps> = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
    }}
  >
    <DiscountBanner />
    <PublicNavbar />
    <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {children}
    </Box>
    <PublicFooter />
  </Box>
);
