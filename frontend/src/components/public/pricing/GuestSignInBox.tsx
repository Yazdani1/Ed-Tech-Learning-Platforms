'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { PRICING_SIGN_IN_HREF } from './PlanAction';

/** Under the plans for visitors: sign in (back to /pricing) or create an account. */
export const GuestSignInBox = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        mt: 7,
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        bgcolor: 'grey.50',
        border: 1,
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
        {t('public.pricing.haveAccount')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('public.pricing.signInToSubscribe')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          component={Link}
          href={PRICING_SIGN_IN_HREF}
          variant="outlined"
          sx={{ minHeight: 44 }}
        >
          {t('public.pricing.signIn')}
        </Button>
        <Button component={Link} href="/auth/register" variant="contained" sx={{ minHeight: 44 }}>
          {t('public.pricing.createAccount')}
        </Button>
      </Box>
    </Box>
  );
};
