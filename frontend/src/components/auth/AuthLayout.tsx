import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { Suspense, type FC, type ReactNode } from 'react';

import { AuthCornerArt } from './AuthCornerArt';
import { AuthHeroPanel } from './AuthHeroPanel';
import { GuestGate } from './GuestGate';

interface AuthLayoutProps {
  children: ReactNode;
}

/** Frame of /auth/login and /auth/register: hero panel (desktop) + form, same look as the old client. */
export const AuthLayout: FC<AuthLayoutProps> = ({ children }) => (
  <Box
    component="main"
    sx={{
      minHeight: '100dvh',
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <AuthCornerArt position="topLeft" />
    <AuthCornerArt position="bottomLeft" />
    <AuthCornerArt position="bottomRight" />
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4, md: 7 }, px: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          minHeight: { md: 620 },
        }}
      >
        <AuthHeroPanel />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 4, md: 5 },
            py: { xs: 4, md: 5 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 430 }}>
            {/* Suspense: GuestGate reads ?next= from the URL (useSearchParams) */}
            <Suspense>
              <GuestGate>{children}</GuestGate>
            </Suspense>
          </Box>
        </Box>
      </Paper>
    </Container>
  </Box>
);
