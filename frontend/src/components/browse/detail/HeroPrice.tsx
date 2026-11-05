'use client';

import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT, MONO_FONT } from '@/theme/fonts';
import { formatBdt, getCoursePriceInfo, localizeDigits } from '@/utils/price';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface HeroPriceProps {
  course: Course;
}

const PRICE_SX = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 700,
  fontSize: { xs: '2.25rem', md: '2.75rem' },
  lineHeight: 1,
  color: '#fbbf24',
} as const;
const SAVE_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.5,
  py: 0.5,
  borderRadius: 99,
  bgcolor: 'rgba(245,158,11,0.15)',
  border: '1px solid rgba(251,191,36,0.5)',
  color: '#fcd34d',
  fontFamily: MONO_FONT,
  fontSize: '0.8rem',
  fontWeight: 700,
} as const;

/** The banner's price: current price, struck-through list price and the saving while a discount runs. */
export const HeroPrice: FC<HeroPriceProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  const money = (value: number): string => localizeDigits(formatBdt(value), i18n.language);
  const price = getCoursePriceInfo(course);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
      <Typography component="p" sx={PRICE_SX}>
        {price.isFree ? t('browse.card.free') : money(price.discountPrice)}
      </Typography>
      {price.hasDiscount && (
        <>
          <Typography
            component="s"
            sx={{ fontFamily: DISPLAY_FONT, color: '#94a3b8', fontSize: '1.25rem' }}
          >
            {money(price.listPrice)}
          </Typography>
          <Box sx={SAVE_SX}>
            <LocalOfferOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
            {localizeDigits(
              t('browse.detail.saveChip', {
                amount: formatBdt(price.discountAmount),
                percent: price.discountPercent,
              }),
              i18n.language,
            )}
          </Box>
        </>
      )}
    </Box>
  );
};
