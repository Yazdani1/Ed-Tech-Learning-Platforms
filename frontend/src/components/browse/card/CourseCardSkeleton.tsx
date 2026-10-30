import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

/** Placeholder of a course card while the catalog loads. */
export const CourseCardSkeleton = () => (
  <Card
    elevation={0}
    aria-hidden
    sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
  >
    <Skeleton variant="rectangular" animation="wave" sx={{ width: '100%', height: 175 }} />
    <Box sx={{ p: 1.5 }}>
      <Skeleton animation="wave" variant="text" sx={{ fontSize: '1rem', width: '92%' }} />
      <Skeleton animation="wave" variant="text" sx={{ fontSize: '1rem', width: '72%' }} />
      <Skeleton
        animation="wave"
        variant="text"
        sx={{ fontSize: '0.8rem', width: '58%', mt: 0.5 }}
      />
      <Box sx={{ minHeight: 34 }} />
      <Skeleton animation="wave" variant="text" sx={{ fontSize: '1.1rem', width: 64 }} />
    </Box>
  </Card>
);
