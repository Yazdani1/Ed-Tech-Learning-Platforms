import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { CardGridSkeleton } from '@/components/common/skeletons/CardGridSkeleton';

const BANNER_HEIGHT = 150;
const AVATAR = 120;
const STAT_HEIGHT = 108;
const FACTS_HEIGHT = 180;
const STAT_COLUMNS = { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } as const;

/** The profile while it loads: banner with avatar and name, the facts, then the stat cards. */
export const ProfileSkeleton = () => {
  const { t } = useTranslation();
  return (
    <Box aria-busy="true" aria-label={t('common.loading')}>
      <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 3 }}>
        <Skeleton variant="rectangular" height={BANNER_HEIGHT} />
        <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', mt: -7, mb: 3 }}>
            <Skeleton variant="circular" width={AVATAR} height={AVATAR} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="40%" height={40} />
              <Skeleton width="60%" />
            </Box>
          </Box>
          <Skeleton variant="rounded" height={FACTS_HEIGHT} />
        </Box>
      </Paper>
      <CardGridSkeleton count={4} columns={STAT_COLUMNS} height={STAT_HEIGHT} mb={3} />
    </Box>
  );
};
