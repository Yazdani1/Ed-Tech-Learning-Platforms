'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useTeachers } from '@/api/public.api';

import { TeacherMarqueeRow } from './TeacherMarqueeRow';

import type { TeacherProfile } from '@/schemas/public.schema';

/** The row needs at least this many cards to fill a wide screen before it loops. */
const MIN_CARDS = 15;
const LEFT_SECONDS = 50;
const RIGHT_SECONDS = 45;

const TITLE_SX = {
  fontWeight: 900,
  mb: 1.5,
  fontSize: { xs: '2rem', md: '2.8rem' },
  color: '#0f172a',
} as const;
const TAGLINE_SX = {
  fontWeight: 800,
  mb: 1,
  fontSize: { xs: '1.1rem', md: '1.35rem' },
  color: '#1e293b',
} as const;

const repeatToFill = (teachers: TeacherProfile[]): TeacherProfile[] => {
  let repeated = [...teachers];
  while (repeated.length < MIN_CARDS) repeated = [...repeated, ...teachers];
  return repeated;
};

/** "Our Instructors": two rows of teacher cards scrolling in opposite directions. */
export const TeacherMarqueeSection = () => {
  const { t } = useTranslation();
  const { data } = useTeachers();
  const teachers = data ?? [];
  // Decorative band: while loading, on error or without teachers it is simply left out
  if (teachers.length === 0) return null;

  const repeated = repeatToFill(teachers);
  const reversed = [...repeated].reverse();

  return (
    <Box
      component="section"
      aria-labelledby="public-instructors-title"
      sx={{ bgcolor: '#f8fafc', overflow: 'hidden', py: { xs: 5, md: 8 } }}
    >
      <TeacherMarqueeRow
        teachers={[...repeated, ...repeated]}
        uniqueCount={teachers.length}
        direction="left"
        durationSeconds={LEFT_SECONDS}
      />
      <Container maxWidth="sm" sx={{ textAlign: 'center', my: { xs: 3, md: 5 } }}>
        <Typography id="public-instructors-title" variant="h3" component="h2" sx={TITLE_SX}>
          {t('public.instructors.title')}
        </Typography>
        <Typography sx={TAGLINE_SX}>{t('public.instructors.tagline')}</Typography>
        <Typography
          variant="body2"
          sx={{ color: '#64748b', maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}
        >
          {t('public.instructors.body')}
        </Typography>
        <Button component={Link} href="/teachers" sx={{ mt: 2, minHeight: 44, fontWeight: 700 }}>
          {t('public.nav.teachers')}
        </Button>
      </Container>
      <TeacherMarqueeRow
        teachers={[...reversed, ...reversed]}
        uniqueCount={0}
        direction="right"
        durationSeconds={RIGHT_SECONDS}
      />
    </Box>
  );
};
