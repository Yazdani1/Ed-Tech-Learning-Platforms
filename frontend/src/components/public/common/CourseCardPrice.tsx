'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT } from '@/theme/fonts';
import { formatBdt, getCoursePriceInfo, localizeDigits, type PriceableCourse } from '@/utils/price';

import type { FC } from 'react';

interface CourseCardPriceProps {
  course: PriceableCourse;
}

const PRICE_SX = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 700,
  fontSize: '1.75rem',
  lineHeight: 1.1,
} as const;
const CHIP_SX = {
  px: 1,
  py: 0.25,
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const;
const DARK_CHIP_SX = { ...CHIP_SX, bgcolor: '#065f46', color: 'common.white' } as const;
const LIGHT_CHIP_SX = { ...CHIP_SX, bgcolor: '#a7f3d0', color: '#064e3b' } as const;

/** The card's price line: price and struck-through list price on the left, the discount and saving chips. */
export const CourseCardPrice: FC<CourseCardPriceProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  const price = getCoursePriceInfo(course);
  const money = (value: number): string => localizeDigits(formatBdt(value), i18n.language);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
        <Typography
          component="span"
          sx={{ ...PRICE_SX, color: price.isFree ? '#047857' : 'text.primary' }}
        >
          {price.isFree ? t('common.free') : money(price.discountPrice)}
        </Typography>
        {price.hasDiscount && (
          <Typography component="s" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            {money(price.listPrice)}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {price.hasDiscount && (
          <>
            <Box component="span" sx={DARK_CHIP_SX}>
              {localizeDigits(
                t('common.percentOff', { percent: price.discountPercent }),
                i18n.language,
              )}
            </Box>
            <Box component="span" sx={LIGHT_CHIP_SX}>
              {t('public.courses.save', { amount: money(price.discountAmount) })}
            </Box>
          </>
        )}
        {price.isFree && (
          <Box component="span" sx={LIGHT_CHIP_SX}>
            {t('public.courses.scholarship')}
          </Box>
        )}
      </Box>
    </Box>
  );
};
