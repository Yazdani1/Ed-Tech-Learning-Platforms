'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { CourseShowcaseSection } from '../common/CourseShowcaseSection';

import { HomeHeroSlider } from './HomeHeroSlider';

const LIVE = { kind: 'live' } as const;
const FREE = { kind: 'free' } as const;

/** The public home page (/): the showcase slider, then the live courses (live course types) and the free ones. */
export const HomePage = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ pb: { xs: 6, md: 10 } }}>
      <HomeHeroSlider />
      <CourseShowcaseSection
        source={LIVE}
        sectionId="home-paid-courses"
        title={t('public.home.paid.title')}
        subtitle={t('public.home.paid.subtitle')}
        emptyText={t('public.home.paid.empty')}
      />
      <CourseShowcaseSection
        source={FREE}
        sectionId="home-free-courses"
        title={t('public.home.free.title')}
        subtitle={t('public.home.free.subtitle')}
        emptyText={t('public.home.free.empty')}
      />
    </Box>
  );
};
