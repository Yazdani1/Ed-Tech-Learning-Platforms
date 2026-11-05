'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import type { PaymentMethodId } from './payment-methods';
import type { FC } from 'react';

interface PaymentMethodLogosProps {
  id: PaymentMethodId;
}

const TILE_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 1.25,
  py: 0.75,
  borderRadius: '8px',
  bgcolor: 'common.white',
  fontSize: '0.8rem',
  fontWeight: 700,
  flexShrink: 0,
} as const;
const CIRCLE_SIZE = 16;

/** Word marks of a payment method's providers (the list beside it already names them, so they are decorative). */
export const PaymentMethodLogos: FC<PaymentMethodLogosProps> = ({ id }) => {
  const { t } = useTranslation();
  if (id === 'bkash') {
    return (
      <Box sx={TILE_SX} aria-hidden>
        <Box component="span" sx={{ color: '#d6175f', fontSize: '0.95rem' }}>
          bKash
        </Box>
        <Box
          component="span"
          sx={{ px: 0.75, py: 0.25, bgcolor: '#e2e8f0', borderRadius: '4px', fontSize: '0.65rem' }}
        >
          {t('payment.logoPayment')}
        </Box>
      </Box>
    );
  }
  return (
    <Box sx={TILE_SX} aria-hidden>
      <Box component="span" sx={{ color: '#ea580c' }}>
        {t('payment.logoNagad')}
      </Box>
      <Box component="span" sx={{ color: '#7e22ce' }}>
        {t('payment.logoRocket')}
      </Box>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        <Box
          component="span"
          sx={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: '50%', bgcolor: '#dc2626' }}
        />
        <Box
          component="span"
          sx={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: '50%',
            bgcolor: 'rgba(148,163,212,0.7)',
            ml: -0.75,
          }}
        />
      </Box>
      <Box component="span" sx={{ color: '#1e3a8a', fontStyle: 'italic' }}>
        VISA
      </Box>
    </Box>
  );
};
