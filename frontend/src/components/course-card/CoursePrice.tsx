'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatBdt, getCoursePriceInfo, type PriceableCourse } from '@/utils/price';

import type { FC } from 'react';

interface CoursePriceProps {
  course: PriceableCourse;
}

/** "Free", or the current price with the crossed-out list price and "% off" while a discount runs. */
export const CoursePrice: FC<CoursePriceProps> = ({ course }) => {
  const { t } = useTranslation();
  const price = getCoursePriceInfo(course);
  if (price.isFree) {
    return (
      <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'success.main' }}>
        {t('common.free')}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
      <Typography sx={{ fontWeight: 900, fontSize: '1rem' }}>
        {formatBdt(price.discountPrice)}
      </Typography>
      {price.hasDiscount && (
        <>
          <Typography
            color="text.secondary"
            sx={{ textDecoration: 'line-through', fontWeight: 700, fontSize: '0.9rem' }}
          >
            {formatBdt(price.listPrice)}
          </Typography>
          <Chip
            label={t('common.percentOff', { percent: price.discountPercent })}
            size="small"
            color="success"
            sx={{ height: 24, fontSize: '0.75rem', fontWeight: 800 }}
          />
        </>
      )}
    </Box>
  );
};
