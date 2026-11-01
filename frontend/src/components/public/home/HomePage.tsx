import Box from '@mui/material/Box';

import { HomeCourseSection } from './HomeCourseSection';
import { HomeHeroSlider } from './HomeHeroSlider';

/** The public home page (/): the showcase slider, then the paid live courses and the free ones. */
export const HomePage = () => (
  <Box sx={{ pb: { xs: 6, md: 10 } }}>
    <HomeHeroSlider />
    <HomeCourseSection pricing="Paid" textKey="paid" />
    <HomeCourseSection pricing="Free" textKey="free" />
  </Box>
);
