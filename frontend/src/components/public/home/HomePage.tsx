import Divider from '@mui/material/Divider';

import { CourseTypePaths } from './CourseTypePaths';
import { EcosystemBand } from './EcosystemBand';
import { HomeCategoryGrid } from './HomeCategoryGrid';
import { HomeCourses } from './HomeCourses';
import { HomeHeroSlider } from './HomeHeroSlider';
import { TeacherMarqueeSection } from './TeacherMarqueeSection';

/** The public home page (/), in the same order as the old client. */
export const HomePage = () => (
  <>
    <HomeHeroSlider />
    <HomeCategoryGrid />
    <Divider sx={{ mx: { xs: 2, md: 'auto' }, maxWidth: 'lg', width: { md: '100%' }, mt: 2 }} />
    <HomeCourses />
    <EcosystemBand />
    <CourseTypePaths />
    <TeacherMarqueeSection />
  </>
);
