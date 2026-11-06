import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';

const LEARN_ITEMS = 4;
const LEARN_BAND = '#eef1f5';

/** The grey "What you'll learn" band's placeholder: heading and four white item cards. */
export const LearnBandSkeleton = () => (
  <Box sx={{ bgcolor: LEARN_BAND, py: { xs: 4, md: 6 } }}>
    <Container maxWidth="lg">
      <Skeleton variant="text" sx={{ fontSize: '2rem', width: 260, mx: 'auto', mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
        {Array.from({ length: LEARN_ITEMS }, (_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={72}
            sx={{ bgcolor: 'common.white', borderRadius: '16px' }}
          />
        ))}
      </Box>
    </Container>
  </Box>
);
