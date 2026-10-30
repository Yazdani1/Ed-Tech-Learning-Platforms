'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatBdt, type PriceInfo } from '@/utils/price';

import type { FC } from 'react';

interface DirectPriceHeaderProps {
  price: PriceInfo;
}

/** "Enroll for free" / "Buy this course" with the big price, discount chip and savings line. */
export const DirectPriceHeader: FC<DirectPriceHeaderProps> = ({ price }) => {
  const { t } = useTranslation();
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {price.isFree ? t('browse.enroll.enrollFree') : t('browse.enroll.buyCourse')}
      </Typography>
      {price.isFree ? (
        <Typography variant="h5" component="p" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.25 }}>
          {t('browse.enroll.free')}
        </Typography>
      ) : (
        <Box sx={{ mt: 0.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h5" component="p" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              {formatBdt(price.discountPrice)}
            </Typography>
            {price.hasDiscount && (
              <Chip
                label={t('browse.enroll.off', { percent: price.discountPercent })}
                size="small"
                color="success"
                sx={{ height: 24, fontWeight: 800 }}
              />
            )}
          </Box>
          {price.hasDiscount && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('browse.enroll.listPrice')}{' '}
              <Box component="span" sx={{ textDecoration: 'line-through', fontWeight: 700 }}>
                {formatBdt(price.listPrice)}
              </Box>{' '}
              {t('browse.enroll.youSave', { amount: formatBdt(price.discountAmount) })}
            </Typography>
          )}
        </Box>
      )}
    </>
  );
};
