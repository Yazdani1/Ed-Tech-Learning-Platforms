'use client';

import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DirectPriceHeader } from './DirectPriceHeader';
import { OptionCard } from './OptionCard';
import { SUBSCRIPTION_COLOR } from '@/components/course-card/course-card';
import { SubscriptionHeader } from './SubscriptionHeader';

import type { PriceInfo } from '@/utils/price';
import type { FC, ReactNode } from 'react';

interface PurchaseChoiceProps {
  lowestPrice: number | null;
  price: PriceInfo;
  /** Content of the subscription option when chosen */
  subscription: ReactNode;
  /** Content of the direct option when chosen */
  direct: ReactNode;
}

type Option = 'subscription' | 'direct';
const DIRECT_COLOR = '#1565c0';
const RADIO_NAME = 'purchase-option';

/** Two radio cards (subscription first, chosen by default) for a course that is part of a plan. */
export const PurchaseChoice: FC<PurchaseChoiceProps> = ({
  lowestPrice,
  price,
  subscription,
  direct,
}) => {
  const { t } = useTranslation();
  const [option, setOption] = useState<Option>('subscription');
  return (
    <Stack spacing={1.5} role="radiogroup" aria-label={t('browse.enroll.options')}>
      <OptionCard
        name={RADIO_NAME}
        value="subscription"
        selected={option === 'subscription'}
        onSelect={() => {
          setOption('subscription');
        }}
        color={SUBSCRIPTION_COLOR}
        header={<SubscriptionHeader lowestPrice={lowestPrice} />}
      >
        {subscription}
      </OptionCard>
      <OptionCard
        name={RADIO_NAME}
        value="direct"
        selected={option === 'direct'}
        onSelect={() => {
          setOption('direct');
        }}
        color={DIRECT_COLOR}
        header={<DirectPriceHeader price={price} />}
      >
        {direct}
      </OptionCard>
    </Stack>
  );
};
