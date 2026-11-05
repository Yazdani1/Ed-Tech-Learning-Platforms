'use client';

import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { localizeDigits } from '@/utils/price';

import { PaymentMethodOption } from './PaymentMethodOption';
import { PAYMENT_CARD_SX, PAYMENT_METHODS, type PaymentMethodId } from './payment-methods';

import type { FC } from 'react';

interface PaymentMethodCardProps {
  method: PaymentMethodId;
  onChange: (method: PaymentMethodId) => void;
}

const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 1,
  mb: 3,
} as const;
const SAME_PRICE_SX = {
  px: 1,
  py: 0.5,
  borderRadius: '6px',
  bgcolor: '#eef1f5',
  color: '#475569',
} as const;
const HEADING_ID = 'payment-method-heading';

/** "Payment method": the same price on every method; bKash, or cards and other mobile banking. */
export const PaymentMethodCard: FC<PaymentMethodCardProps> = ({ method, onChange }) => {
  const { t, i18n } = useTranslation();
  return (
    <Box
      component="section"
      aria-labelledby={HEADING_ID}
      sx={{ ...PAYMENT_CARD_SX, p: { xs: 2, sm: 2.5 } }}
    >
      <Box sx={HEADER_SX}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentsOutlinedIcon sx={{ color: '#1d4ed8' }} aria-hidden />
          <Typography id={HEADING_ID} component="h2" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            {t('payment.methodTitle')}
          </Typography>
        </Box>
        <Typography variant="caption" sx={SAME_PRICE_SX}>
          {t('payment.samePrice')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#334155' }}>
          {t('payment.fromBangladesh')}
        </Typography>
        <Typography variant="body2" sx={{ color: '#047857', fontWeight: 600 }}>
          {localizeDigits(t('payment.noExtraCharge'), i18n.language)}
        </Typography>
      </Box>
      <Box role="radiogroup" aria-labelledby={HEADING_ID} sx={{ display: 'grid', gap: 1 }}>
        {PAYMENT_METHODS.map((id) => (
          <PaymentMethodOption
            key={id}
            id={id}
            selected={method === id}
            onSelect={() => {
              onChange(id);
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
