'use client';

import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatBdt } from '@/utils/price';

import type { FC } from 'react';

interface SubscriptionHeaderProps {
  /** Cheapest monthly price of the plans that include the course, or null */
  lowestPrice: number | null;
}

/** "Subscribe and save" with the cheapest plan price. */
export const SubscriptionHeader: FC<SubscriptionHeaderProps> = ({ lowestPrice }) => {
  const { t } = useTranslation();
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {t('browse.enroll.subscribeAndSave')}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {lowestPrice === null
          ? t('browse.enroll.viewPlansHint')
          : t('browse.enroll.fromPrice', { price: formatBdt(lowestPrice) })}
      </Typography>
    </>
  );
};
