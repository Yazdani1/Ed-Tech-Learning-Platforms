'use client';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { HeroChips } from './HeroChips';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseDetailHeroProps {
  course: Course;
}

const ACCENT = '#a78bfa';
const HERO_BG = '#1c1d1f';
const TITLE_SX = {
  fontWeight: 800,
  mb: 1.5,
  lineHeight: 1.25,
  fontSize: { xs: '1.6rem', md: '2rem' },
  wordBreak: 'break-word',
} as const;

/** Dark banner: breadcrumb, title, subtitle, chips, teachers. */
export const CourseDetailHero: FC<CourseDetailHeroProps> = ({ course }) => {
  const { t } = useTranslation();
  const teachers = course.teachers.flatMap((teacher) => (teacher ? [teacher.name] : []));

  return (
    <Box sx={{ bgcolor: HERO_BG, color: 'common.white', py: { xs: 4, md: 7 } }}>
      <Container maxWidth="lg">
        <Grid container>
          <Grid size={{ xs: 12, md: 8 }}>
            <Breadcrumbs
              aria-label={t('browse.detail.breadcrumb')}
              separator="»"
              sx={{ mb: 2, color: 'grey.500', '& .MuiBreadcrumbs-li': { fontSize: '0.75rem' } }}
            >
              <Box
                component={Link}
                href="/"
                sx={{ color: ACCENT, '&:hover': { textDecoration: 'underline' } }}
              >
                {t('browse.detail.home')}
              </Box>
              {course.category && <Box sx={{ color: ACCENT }}>{course.category.name}</Box>}
              {course.courseType && <Box sx={{ color: ACCENT }}>{course.courseType.name}</Box>}
            </Breadcrumbs>
            <Typography component="h1" variant="h4" sx={TITLE_SX}>
              {course.title}
            </Typography>
            {course.subtitle && (
              <Typography sx={{ opacity: 0.85, mb: 2, fontSize: { xs: '1rem', md: '1.15rem' } }}>
                {course.subtitle}
              </Typography>
            )}
            <HeroChips course={course} />
            {teachers.length > 0 && (
              <Typography variant="body2">
                <Box component="span" sx={{ opacity: 0.75, mr: 1 }}>
                  {t('browse.detail.createdBy')}
                </Box>
                <Box component="span" sx={{ color: ACCENT, fontWeight: 500 }}>
                  {teachers.join(', ')}
                </Box>
              </Typography>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
