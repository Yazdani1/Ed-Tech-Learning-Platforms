'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { formatBdt, getCoursePriceInfo } from '@/utils/price';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface HeroChipsProps {
  course: Course;
}

const chipSx = (bgcolor: string) => ({ bgcolor, color: 'common.white', fontWeight: 600 });

/** Price (with discount) and subscription chips of the course banner (the course type is shown above the title). */
export const HeroChips: FC<HeroChipsProps> = ({ course }) => {
  const { t } = useTranslation();
  const price = getCoursePriceInfo(course);
  let priceLabel = formatBdt(price.discountPrice);
  if (price.isFree) priceLabel = t('browse.card.free');
  else if (price.hasDiscount) {
    priceLabel = t('browse.detail.discountChip', {
      price: priceLabel,
      percent: price.discountPercent,
    });
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      <Chip label={priceLabel} size="small" sx={chipSx(price.isFree ? '#0284c7' : '#d97706')} />
      {course.includedInSubscription && (
        <Chip label={t('browse.detail.subscriptionChip')} size="small" sx={chipSx('#7c3aed')} />
      )}
    </Box>
  );
};
