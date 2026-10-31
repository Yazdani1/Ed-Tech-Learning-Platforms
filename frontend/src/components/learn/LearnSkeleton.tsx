import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const SKELETON_ROWS = 4;

/** Loading state of the player: top bar, menu and a video-sized block. */
export const LearnSkeleton = () => (
  <Box aria-busy="true">
    <Skeleton variant="rectangular" height={56} />
    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
      <Box sx={{ width: 200, display: { xs: 'none', md: 'block' } }}>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} height={44} />
        ))}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton
          variant="rectangular"
          sx={{ width: '100%', aspectRatio: '16 / 9', height: 'auto' }}
        />
        <Skeleton width="60%" height={32} sx={{ mt: 2 }} />
      </Box>
    </Box>
  </Box>
);
