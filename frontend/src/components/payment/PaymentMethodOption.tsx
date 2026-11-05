'use client';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PaymentMethodLogos } from './PaymentMethodLogos';

import type { PaymentMethodId } from './payment-methods';
import type { FC } from 'react';

interface PaymentMethodOptionProps {
  id: PaymentMethodId;
  selected: boolean;
  onSelect: () => void;
}

const LABEL_SX = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: { xs: 'wrap', sm: 'nowrap' },
  gap: 1.5,
  p: { xs: 1.5, sm: 2 },
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
} as const;
const POPULAR_SX = {
  px: 1,
  py: 0.25,
  borderRadius: 99,
  bgcolor: '#dbe4ff',
  color: '#1e3a8a',
  fontSize: '0.75rem',
  fontWeight: 600,
} as const;

/** One payment method: radio, name (bKash is marked "most popular"), what it covers and its logos. */
export const PaymentMethodOption: FC<PaymentMethodOptionProps> = ({ id, selected, onSelect }) => {
  const { t } = useTranslation();
  return (
    <Box component="label" sx={{ ...LABEL_SX, bgcolor: selected ? '#eef2ff' : '#f1f3f6' }}>
      <Radio
        name="payment-method"
        value={id}
        checked={selected}
        onChange={onSelect}
        sx={{ p: 0.5, '&.Mui-checked': { color: '#1d4ed8' } }}
      />
      <Box sx={{ flex: 1, minWidth: 180 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
            {t(`payment.methods.${id}.name`)}
          </Typography>
          {id === 'bkash' && (
            <Box component="span" sx={POPULAR_SX}>
              {t('payment.mostPopular')}
            </Box>
          )}
        </Box>
        <Typography variant="body2" sx={{ color: '#475569', display: 'block' }} component="span">
          {t(`payment.methods.${id}.hint`)}
        </Typography>
      </Box>
      <PaymentMethodLogos id={id} />
    </Box>
  );
};
