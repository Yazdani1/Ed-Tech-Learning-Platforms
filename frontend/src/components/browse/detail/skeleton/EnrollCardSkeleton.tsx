import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

/** The enrolment card's placeholder: preview, price, coupon box, Enroll button and the perks. */
export const EnrollCardSkeleton = () => (
  <Paper variant="outlined" sx={{ borderRadius: '18px', overflow: 'hidden' }}>
    <Skeleton variant="rectangular" height={190} />
    <Box sx={{ p: 2.5 }}>
      <Skeleton variant="text" width={120} />
      <Skeleton variant="text" sx={{ fontSize: '2.6rem', width: 160 }} />
      <Skeleton variant="rounded" height={64} sx={{ my: 2, borderRadius: '12px' }} />
      <Skeleton variant="rounded" height={54} sx={{ borderRadius: '10px' }} />
      <Stack spacing={1} sx={{ mt: 2 }}>
        <Skeleton variant="text" width="85%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="78%" />
      </Stack>
    </Box>
  </Paper>
);
