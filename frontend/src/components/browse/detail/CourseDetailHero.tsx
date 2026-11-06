'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT, MONO_FONT } from '@/theme/fonts';

import { ENROLL_ATTENTION_SX } from './enrollment/enroll-attention';
import { EnrollNowButton } from './enrollment/EnrollNowButton';
import { useCanEnroll } from './enrollment/useCanEnroll';
import { HeroBreadcrumbs } from './HeroBreadcrumbs';
import { HeroPrice } from './HeroPrice';

import type { Course } from '@/schemas/browse.schema';
import { BatchNumberChip } from '@/components/course-card/BatchNumberChip';
import type { FC } from 'react';

interface CourseDetailHeroProps {
  course: Course;
  /** Id of the enrolment card (Enroll Now scrolls there when the page has choices to make) */
  enrollTargetId: string;
}

const HERO_SX = {
  color: 'common.white',
  py: { xs: 4, md: 5 },
  backgroundColor: '#070f26',
  backgroundImage: [
    'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
    'linear-gradient(120deg, #060c1f 0%, #0d1b40 60%, #0a1533 100%)',
  ].join(', '),
  backgroundSize: '44px 44px, 44px 44px, auto',
} as const;
const TITLE_SX = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 700,
  lineHeight: 1.15,
  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
  letterSpacing: '-0.01em',
  overflowWrap: 'anywhere',
  mb: 2,
} as const;
const BADGE_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 1.5,
  py: 0.5,
  maxWidth: '100%',
  borderRadius: 99,
  bgcolor: 'rgba(37,99,235,0.3)',
  border: '1px solid rgba(96,165,250,0.5)',
  color: '#bfdbfe',
  fontFamily: MONO_FONT,
  fontSize: '0.85rem',
  fontWeight: 700,
  textTransform: 'uppercase',
} as const;
const DOT_SX = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  bgcolor: '#34d399',
  flexShrink: 0,
} as const;
const ENROLL_SX = {
  ...ENROLL_ATTENTION_SX,
  minHeight: 54,
  px: 4,
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '1rem',
  color: '#0f172a',
  background: 'linear-gradient(100deg, #f59e0b 0%, #fbbf24 55%, #f87171 100%)',
  boxShadow: '0 10px 24px rgba(245,158,11,0.3)',
  '&:hover': { background: 'linear-gradient(100deg, #d97706 0%, #f59e0b 55%, #ef4444 100%)' },
} as const;

/** Dark banner: breadcrumb, course type, title, subtitle, price with its saving, Enroll Now (animated). */
export const CourseDetailHero: FC<CourseDetailHeroProps> = ({ course, enrollTargetId }) => {
  const { t } = useTranslation();
  const canEnroll = useCanEnroll(course._id);

  return (
    <Box sx={HERO_SX}>
      <Container maxWidth="lg">
        <Grid container>
          <Grid size={{ xs: 12, md: 8 }} sx={{ pr: { md: 4 } }}>
            <HeroBreadcrumbs course={course} />
            {(course.courseType ?? course.batchNumber) && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <BatchNumberChip batchNumber={course.batchNumber} tone="dark" />
                {course.courseType && (
                  <Box sx={BADGE_SX}>
                    <Box sx={DOT_SX} aria-hidden />
                    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.courseType.name}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
            <Typography component="h1" sx={TITLE_SX}>
              {course.title}
            </Typography>
            {course.subtitle && (
              <Typography sx={{ color: '#cbd5e1', mb: 3, fontSize: { xs: '1rem', md: '1.15rem' } }}>
                {course.subtitle}
              </Typography>
            )}
            <HeroPrice course={course} />
            {course.includedInSubscription && (
              <Chip
                label={t('browse.detail.subscriptionChip')}
                size="small"
                sx={{ bgcolor: '#7c3aed', color: 'common.white', fontWeight: 600, mb: 3 }}
              />
            )}
            {canEnroll && (
              <EnrollNowButton course={course} targetId={enrollTargetId} sx={ENROLL_SX} />
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
