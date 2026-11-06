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

// Sizes follow the card's own width (container query units on the wrapper), so the whole row fits one line
const CONTAINER_SX = { containerType: 'inline-size', width: '100%' } as const;
const ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'nowrap',
  gap: '2cqi',
  minWidth: 0,
  whiteSpace: 'nowrap',
} as const;
const PRICE_SX = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 700,
  fontSize: 'clamp(0.95rem, 6.4cqi, 1.45rem)',
  lineHeight: 1.1,
  flexShrink: 0,
} as const;
const OLD_PRICE_SX = {
  color: '#64748b',
  fontSize: 'clamp(0.62rem, 3.6cqi, 0.88rem)',
  flexShrink: 0,
} as const;
const CHIP_SX = {
  px: '1.8cqi',
  py: 0.25,
  borderRadius: '6px',
  fontSize: 'clamp(0.58rem, 3.1cqi, 0.75rem)',
  fontWeight: 700,
  flexShrink: 0,
} as const;
const DARK_CHIP_SX = { ...CHIP_SX, bgcolor: '#065f46', color: 'common.white' } as const;
const LIGHT_CHIP_SX = { ...CHIP_SX, bgcolor: '#a7f3d0', color: '#064e3b' } as const;

/** The card's price line, always one row: price, struck-through list price, "% off" and "Save" chips. */
export const CourseCardPrice: FC<CourseCardPriceProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  const price = getCoursePriceInfo(course);
  const money = (value: number): string => localizeDigits(formatBdt(value), i18n.language);
  return (
    <Box sx={CONTAINER_SX}>
      <Box sx={ROW_SX}>
        <Typography
          component="span"
          sx={{ ...PRICE_SX, color: price.isFree ? '#047857' : 'text.primary' }}
        >
          {price.isFree ? t('common.free') : money(price.discountPrice)}
        </Typography>
        {price.hasDiscount && (
          <>
            <Typography component="s" sx={OLD_PRICE_SX}>
              {money(price.listPrice)}
            </Typography>
            <Box component="span" sx={{ ...DARK_CHIP_SX, ml: 'auto' }}>
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
      </Box>
    </Box>
  );
};
