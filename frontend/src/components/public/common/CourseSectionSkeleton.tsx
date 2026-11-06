import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { HomeCourseCardSkeleton } from './HomeCourseCardSkeleton';

const CARDS = 3;
const PILLS = 5;
const CARD_SIZE = { xs: 12, sm: 6, md: 4 } as const;

/** Placeholder of one course-type box: centred title and subtitle, category pills, a row of course cards. */
export const CourseSectionSkeleton = () => {
  const { t } = useTranslation();
  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 4, md: 6 } }}
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" sx={{ fontSize: '2rem', width: { xs: '70%', sm: 360 } }} />
        <Skeleton variant="text" sx={{ width: { xs: '85%', sm: 480 } }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
        {Array.from({ length: PILLS }, (_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            width={110}
            height={40}
            sx={{ borderRadius: 99 }}
          />
        ))}
      </Box>
      <Grid container spacing={3}>
        {Array.from({ length: CARDS }, (_, index) => (
          <Grid key={index} size={CARD_SIZE}>
            <HomeCourseCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
