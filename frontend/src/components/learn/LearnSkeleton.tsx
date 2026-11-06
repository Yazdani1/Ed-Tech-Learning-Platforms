import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const MENU_ROWS = 7;
const NAV_WIDTH = 240;
const TOP_BAR_HEIGHT = 64;

/**
 * Loading state of the player with its real layout: top bar, the menu column running the full screen
 * height on desktop (a tab strip on phones), and the video with its title.
 */
export const LearnSkeleton = () => (
  <Box aria-busy="true" sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
    <Skeleton variant="rectangular" height={TOP_BAR_HEIGHT} />
    <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Box
        sx={{
          width: { md: NAV_WIDTH },
          flexShrink: 0,
          borderRight: { md: 1 },
          borderBottom: { xs: 1, md: 0 },
          borderColor: 'divider',
          p: 1,
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          gap: 0.5,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: MENU_ROWS }, (_, index) => (
          <Skeleton key={index} height={48} sx={{ flexShrink: 0, width: { xs: 96, md: '100%' } }} />
        ))}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        <Skeleton
          variant="rectangular"
          sx={{ width: '100%', aspectRatio: '16 / 9', height: 'auto' }}
        />
        <Skeleton width="60%" height={32} sx={{ mt: 2 }} />
        <Skeleton width="35%" height={24} />
      </Box>
    </Box>
  </Box>
);
