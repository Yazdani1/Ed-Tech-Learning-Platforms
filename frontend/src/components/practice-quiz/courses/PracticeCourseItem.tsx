'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';
import { CoursePrice } from '@/components/course-card/CoursePrice';

import type { FC } from 'react';
import type { PracticeCourse } from '@/schemas/practice-quiz.schema';

interface PracticeCourseItemProps {
  course: PracticeCourse;
  selected: boolean;
  onSelect: () => void;
}

const COVER_SIZE = 72;

const clamp = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }) as const;

/** One course of the list: cover, title, subtitle, price, "Sub" when included in a subscription. */
export const PracticeCourseItem: FC<PracticeCourseItemProps> = ({ course, selected, onSelect }) => {
  const { t } = useTranslation();
  return (
    <ListItemButton
      selected={selected}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      sx={{
        gap: 1.5,
        mx: 1.5,
        mb: 1.5,
        p: 1.25,
        alignItems: 'center',
        borderRadius: 1,
        border: 1,
        borderColor: selected ? 'warning.main' : 'divider',
        bgcolor: 'background.paper',
        '&.Mui-selected': { borderLeftWidth: 4 },
      }}
    >
      <Box sx={{ width: COVER_SIZE, borderRadius: 0.5, overflow: 'hidden', flexShrink: 0 }}>
        <CourseCover src={course.coverImage} alt="" height={COVER_SIZE} sizes="72px" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '0.92rem',
            lineHeight: 1.3,
            color: selected ? 'warning.dark' : 'text.primary',
            ...clamp(2),
          }}
        >
          {course.title}
        </Typography>
        {course.subtitle && (
          <Typography variant="caption" color="text.secondary" sx={clamp(1)}>
            {course.subtitle}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
          <CoursePrice course={course} />
          {course.includedInSubscription && (
            <Chip
              label={t('quiz.practice.courses.subscription')}
              title={t('quiz.practice.courses.subscriptionTitle')}
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
            />
          )}
          {selected && <CheckCircleIcon color="success" sx={{ ml: 'auto', fontSize: 20 }} />}
        </Box>
      </Box>
    </ListItemButton>
  );
};
