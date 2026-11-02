import AllInclusive from '@mui/icons-material/AllInclusive';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import DateRange from '@mui/icons-material/DateRange';
import Today from '@mui/icons-material/Today';

import type { RevenuePeriodKey } from '@/schemas/insights.schema';
import type { ReactElement } from 'react';

/** The icon of each headline period card (dashboard and performance). */
export const PERIOD_ICONS: Record<RevenuePeriodKey, ReactElement> = {
  today: <Today />,
  week: <DateRange />,
  month: <CalendarMonth />,
  lifetime: <AllInclusive />,
};

/** Four cards in a row on desktop, two on tablets, one on phones. */
export const FOUR_COLUMNS = {
  xs: '1fr',
  sm: 'repeat(2, minmax(0, 1fr))',
  lg: 'repeat(4, minmax(0, 1fr))',
} as const;
