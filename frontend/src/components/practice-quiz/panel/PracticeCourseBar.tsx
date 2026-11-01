'use client';

import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';
import { CoursePrice } from '@/components/course-card/CoursePrice';

import { treeBankCount } from '../practice-quiz.utils';

import { PracticeFact } from './PracticeFact';

import type { FC } from 'react';
import type { PracticeTree } from '@/schemas/practice-quiz.schema';

interface PracticeCourseBarProps {
  tree: PracticeTree;
}

const COVER_WIDTH = 72;
const COVER_HEIGHT = 44;

const BAR_SX = {
  px: 2,
  py: 1,
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: 'background.paper',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 2,
} as const;

/** The chosen course: cover, title, number of quizzes (and locked ones), price, "Unlock / View Course". */
export const PracticeCourseBar: FC<PracticeCourseBarProps> = ({ tree }) => {
  const { t } = useTranslation();
  const { course, lockedBankCount } = tree;
  const locked = lockedBankCount > 0;
  return (
    <Box sx={BAR_SX}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 220px', minWidth: 0 }}>
        <Box sx={{ width: COVER_WIDTH, borderRadius: 0.5, overflow: 'hidden', flexShrink: 0 }}>
          <CourseCover src={course.coverImage} alt="" height={COVER_HEIGHT} sizes="72px" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.92rem' }}>
            {course.title}
          </Typography>
          {course.subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {course.subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <PracticeFact label={t('quiz.practice.bar.totalQuiz')}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
            {treeBankCount(tree) + lockedBankCount}
          </Typography>
          {locked && (
            <Chip
              label={t('quiz.practice.bar.locked', { count: lockedBankCount })}
              size="small"
              color="error"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
            />
          )}
        </Box>
      </PracticeFact>
      <PracticeFact label={t('quiz.practice.bar.price')}>
        <CoursePrice course={course} />
      </PracticeFact>
      <Button
        component={Link}
        href={`/courses/${encodeURIComponent(course._id)}`}
        variant="contained"
        color={locked ? 'warning' : 'primary'}
        startIcon={locked ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />}
        sx={{ minHeight: 44, fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap' }}
      >
        {t(locked ? 'quiz.practice.bar.unlock' : 'quiz.practice.bar.view')}
      </Button>
    </Box>
  );
};
