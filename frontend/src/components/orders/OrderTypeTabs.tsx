'use client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import { ORDER_TYPES, type OrderType } from '@/schemas/revenue.schema';

import type { FC } from 'react';

interface OrderTypeTabsProps {
  value: OrderType;
  onChange: (value: OrderType) => void;
  /** Only some of the types (default: all four) */
  types?: readonly OrderType[];
}

/** All / Paid / Free / Subscription switch above an order list. */
export const OrderTypeTabs: FC<OrderTypeTabsProps> = ({ value, onChange, types = ORDER_TYPES }) => {
  const { t } = useTranslation();
  return (
    <Tabs
      value={value}
      onChange={(_event, next: OrderType) => {
        onChange(next);
      }}
      variant="scrollable"
      allowScrollButtonsMobile
      aria-label={t('revenue.typeTabs')}
      sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
    >
      {types.map((type) => (
        <Tab key={type} value={type} label={t(`revenue.types.${type}`)} sx={{ minHeight: 48 }} />
      ))}
    </Tabs>
  );
};
