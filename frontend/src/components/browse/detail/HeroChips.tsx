'use client';

import ClassIcon from '@mui/icons-material/Class';
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

/** Status, price (with discount), course type and subscription chips of the course banner. */
export const HeroChips: FC<HeroChipsProps> = ({ course }) => {
  const { t } = useTranslation();
  const price = getCoursePriceInfo(course);
  const isPublished = course.status === 'Published';
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
      <Chip
        label={isPublished ? t('browse.detail.statusPublished') : t('browse.detail.statusDraft')}
        size="small"
        sx={chipSx(isPublished ? '#16a34a' : '#6b7280')}
      />
      <Chip label={priceLabel} size="small" sx={chipSx(price.isFree ? '#0284c7' : '#d97706')} />
      {course.courseType && (
        <Chip
          icon={<ClassIcon sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
          label={course.courseType.name}
          size="small"
          sx={chipSx('#0f766e')}
        />
      )}
      {course.includedInSubscription && (
        <Chip label={t('browse.detail.subscriptionChip')} size="small" sx={chipSx('#7c3aed')} />
      )}
    </Box>
  );
};
