import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

const CARD_RADIUS = '16px';

/** Left column placeholder: the two schedule cards and the "About this course" card. */
export const AboutSkeleton = () => (
  <>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
      <Skeleton variant="rounded" height={88} sx={{ borderRadius: CARD_RADIUS }} />
      <Skeleton variant="rounded" height={88} sx={{ borderRadius: CARD_RADIUS }} />
    </Box>
    <Paper variant="outlined" sx={{ p: 3, borderRadius: '18px', mb: 4 }}>
      <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: 220, mb: 1 }} />
      <Stack spacing={0.5}>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </Stack>
    </Paper>
  </>
);
