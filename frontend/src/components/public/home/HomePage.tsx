'use client';

import Box from '@mui/material/Box';

import { CourseTypeSections } from '../common/CourseTypeSections';

import { HomeHeroSlider } from './HomeHeroSlider';

/**
 * The public home page (/): the showcase slider, then one box per course type (its name and description,
 * its category cards and paid courses) and the free courses.
 */
export const HomePage = () => (
  <Box sx={{ pb: { xs: 6, md: 10 } }}>
    <HomeHeroSlider />
    <CourseTypeSections idPrefix="home" />
  </Box>
);
