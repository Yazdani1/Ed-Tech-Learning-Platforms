import Box from '@mui/material/Box';

import { HomeCourseSection } from './HomeCourseSection';
import { HomeHeroSlider } from './HomeHeroSlider';

/** The public home page (/): the showcase slider, then the live courses (live course types) and the free ones. */
export const HomePage = () => (
  <Box sx={{ pb: { xs: 6, md: 10 } }}>
    <HomeHeroSlider />
    <HomeCourseSection section="live" textKey="paid" />
    <HomeCourseSection section="free" textKey="free" />
  </Box>
);
