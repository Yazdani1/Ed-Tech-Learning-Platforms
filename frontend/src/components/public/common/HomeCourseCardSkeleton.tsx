import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

const COVER_HEIGHT = 200;
const BUTTON_HEIGHT = 52;

/**
 * Placeholder with the same parts as the home / pricing course card: cover, batch + start date pills, two
 * title lines, the price row and "See Details".
 */
export const HomeCourseCardSkeleton = () => (
  <Card
    elevation={0}
    aria-hidden
    sx={{ height: '100%', borderRadius: '20px', border: '1px solid #e7ebf1', overflow: 'hidden' }}
  >
    <Skeleton variant="rectangular" animation="wave" height={COVER_HEIGHT} />
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={84}
          height={28}
          sx={{ borderRadius: 99 }}
        />
        <Skeleton
          variant="rounded"
          animation="wave"
          width={180}
          height={28}
          sx={{ borderRadius: 99 }}
        />
      </Box>
      <Box>
        <Skeleton variant="text" animation="wave" sx={{ fontSize: '1.2rem', width: '92%' }} />
        <Skeleton variant="text" animation="wave" sx={{ fontSize: '1.2rem', width: '64%' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="text" animation="wave" sx={{ fontSize: '1.45rem', width: 90 }} />
        <Skeleton variant="text" animation="wave" sx={{ width: 48 }} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rounded" animation="wave" width={56} height={22} />
        <Skeleton variant="rounded" animation="wave" width={72} height={22} />
      </Box>
    </Box>
    <Box sx={{ p: 2, pt: 0 }}>
      <Skeleton
        variant="rounded"
        animation="wave"
        height={BUTTON_HEIGHT}
        sx={{ borderRadius: '12px' }}
      />
    </Box>
  </Card>
);
