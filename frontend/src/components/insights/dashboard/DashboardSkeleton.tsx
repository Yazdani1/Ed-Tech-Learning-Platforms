import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { CardGridSkeleton } from '@/components/common/skeletons/CardGridSkeleton';

import { CHART_HEIGHT } from '../insights.utils';
import { FOUR_COLUMNS } from '../period-icons';

const CARD_HEIGHT = 132;
const STAT_HEIGHT = 104;
/** Chart card: title row + plot */
const CHART_CARD_HEIGHT = CHART_HEIGHT + 72;
const TWO_COLUMNS = { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } as const;
const WIDE_AND_NARROW = { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' } as const;
const TOP_COURSES_HEIGHT = 320;

/** The dashboard while it loads: revenue cards, stat cards, two chart rows and the top courses, in their real grids. */
export const DashboardSkeleton = () => {
  const { t } = useTranslation();
  return (
    <Box aria-busy="true" aria-label={t('common.loading')}>
      <CardGridSkeleton count={4} columns={FOUR_COLUMNS} height={CARD_HEIGHT} />
      <CardGridSkeleton count={4} columns={FOUR_COLUMNS} height={STAT_HEIGHT} mb={3} />
      <CardGridSkeleton count={2} columns={TWO_COLUMNS} height={CHART_CARD_HEIGHT} />
      <CardGridSkeleton count={2} columns={WIDE_AND_NARROW} height={CHART_CARD_HEIGHT} mb={3} />
      <Skeleton variant="rounded" height={TOP_COURSES_HEIGHT} />
    </Box>
  );
};
