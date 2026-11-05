'use client';

import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT } from '@/theme/fonts';
import { formatBdt, localizeDigits, type PriceInfo } from '@/utils/price';

import type { FC } from 'react';

interface PaymentTotalProps {
  price: PriceInfo;
}

const BOX_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 1.5,
  p: 2,
  mb: 2,
  borderRadius: '12px',
  bgcolor: '#f1f3f6',
} as const;

/** The grey total box: "Total payment" with the saving on the left, the big amount on the right. */
export const PaymentTotal: FC<PaymentTotalProps> = ({ price }) => {
  const { t, i18n } = useTranslation();
  const money = (value: number): string => localizeDigits(formatBdt(value), i18n.language);
  return (
    <Box sx={BOX_SX}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem' }}>{t('payment.total')}</Typography>
        {price.hasDiscount && (
          <Typography
            variant="body2"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#047857' }}
          >
            <TrendingDownIcon sx={{ fontSize: 16 }} aria-hidden />
            {t('payment.saving', {
              amount: money(price.discountAmount),
              percent: localizeDigits(String(price.discountPercent), i18n.language),
            })}
          </Typography>
        )}
      </Box>
      <Box sx={{ textAlign: 'right', ml: 'auto' }}>
        <Typography
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 700,
            lineHeight: 1.1,
            fontSize: { xs: '2rem', sm: '2.5rem' },
          }}
        >
          {money(price.discountPrice)}
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569' }}>
          {t('payment.oneTime')}
        </Typography>
      </Box>
    </Box>
  );
};
