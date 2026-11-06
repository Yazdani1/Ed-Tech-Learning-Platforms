'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseThumb } from '@/components/course-picker/CourseThumb';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface CourseCheckRowProps {
  course: AdminCourse;
  checked: boolean;
  onToggle: (id: string) => void;
}

const THUMB_WIDTH = 56;

/** One course of the list: tick box, cover, title and batch number (the whole row toggles it). */
export const CourseCheckRow: FC<CourseCheckRowProps> = ({ course, checked, onToggle }) => {
  const { t } = useTranslation();
  return (
    <ListItemButton
      onClick={() => {
        onToggle(course._id);
      }}
      sx={{ gap: 1.5, minHeight: 56 }}
    >
      <Checkbox
        edge="start"
        checked={checked}
        tabIndex={-1}
        disableRipple
        slotProps={{ input: { 'aria-label': course.title } }}
      />
      <CourseThumb coverImage={course.coverImage} width={THUMB_WIDTH} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
          {course.title}
        </Typography>
        {course.batchNumber && (
          <Typography variant="caption" color="text.secondary">
            {t('public.courses.batch', { number: course.batchNumber })}
          </Typography>
        )}
      </Box>
    </ListItemButton>
  );
};
