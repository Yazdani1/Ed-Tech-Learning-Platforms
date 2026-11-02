'use client';

import DoneAllIcon from '@mui/icons-material/DoneAll';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatBdt, getCoursePriceInfo } from '@/utils/price';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface BuyBarPriceProps {
  course: Course;
  /** Company phone (Company Contact page); the "Call Now" line is hidden without it */
  phone?: string;
}

const DISCOUNT_SX = {
  color: 'success.main',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
} as const;

/** Left side of the buy bar: "Call Now" with the phone link, the price, the old price and the discount. */
export const BuyBarPrice: FC<BuyBarPriceProps> = ({ course, phone }) => {
  const { t } = useTranslation();
  const price = getCoursePriceInfo(course);
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {phone && (
        <Typography variant="body2" color="text.secondary" noWrap>
          {t('browse.buyBar.callNow')}{' '}
          <Link
            href={`tel:${phone.replace(/[\s-]/g, '')}`}
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            {phone}
          </Link>
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1.5 }}>
        <Typography
          component="span"
          sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.6rem' } }}
        >
          {price.isFree ? t('browse.card.free') : formatBdt(price.discountPrice)}
        </Typography>
        {price.hasDiscount && (
          <>
            <Typography component="s" color="text.secondary" sx={{ fontWeight: 600 }}>
              {formatBdt(price.listPrice)}
            </Typography>
            <Typography component="span" variant="body2" sx={DISCOUNT_SX}>
              <DoneAllIcon fontSize="small" aria-hidden />
              {t('browse.buyBar.discountApplied', { percent: price.discountPercent })}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};
