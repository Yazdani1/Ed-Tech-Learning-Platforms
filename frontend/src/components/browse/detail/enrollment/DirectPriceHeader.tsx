'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT, MONO_FONT } from '@/theme/fonts';
import { formatBdt, localizeDigits, type PriceInfo } from '@/utils/price';

import type { FC } from 'react';

interface DirectPriceHeaderProps {
  price: PriceInfo;
  /** Inside a radio option of the card: a smaller price */
  compact?: boolean;
}

const LABEL_SX = {
  display: 'block',
  fontFamily: MONO_FONT,
  fontSize: '0.8rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
} as const;
const OFF_SX = {
  px: 1.25,
  py: 0.25,
  borderRadius: 99,
  bgcolor: '#fef3c7',
  color: '#78350f',
  fontFamily: MONO_FONT,
  fontSize: '0.8rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const;

/** "Enroll for free" / "Buy this course" with the big price, the list price, "% off" and the saving. */
export const DirectPriceHeader: FC<DirectPriceHeaderProps> = ({ price, compact = false }) => {
  const { t, i18n } = useTranslation();
  const money = (value: number): string => localizeDigits(formatBdt(value), i18n.language);
  const priceSx = {
    fontFamily: DISPLAY_FONT,
    fontWeight: 700,
    lineHeight: 1.1,
    fontSize: compact ? '1.5rem' : '3rem',
  };
  return (
    <>
      <Typography component="span" sx={LABEL_SX}>
        {price.isFree ? t('browse.enroll.enrollFree') : t('browse.enroll.buyCourse')}
      </Typography>
      {price.isFree ? (
        <Typography component="p" sx={{ ...priceSx, mt: 0.5 }}>
          {t('browse.enroll.free')}
        </Typography>
      ) : (
        <Box sx={{ mt: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography component="p" sx={priceSx}>
              {money(price.discountPrice)}
            </Typography>
            {price.hasDiscount && (
              <>
                <Typography
                  component="s"
                  sx={{ fontFamily: DISPLAY_FONT, color: '#64748b', fontSize: '1.15rem' }}
                >
                  {money(price.listPrice)}
                </Typography>
                <Box component="span" sx={OFF_SX}>
                  {localizeDigits(
                    t('browse.enroll.off', { percent: price.discountPercent }),
                    i18n.language,
                  )}
                </Box>
              </>
            )}
          </Box>
          {price.hasDiscount && (
            <Typography variant="body2" sx={{ mt: 1, color: '#047857', fontWeight: 500 }}>
              {t('browse.enroll.youSave', { amount: money(price.discountAmount) })}
            </Typography>
          )}
        </Box>
      )}
    </>
  );
};
