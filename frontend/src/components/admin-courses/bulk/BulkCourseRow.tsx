'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface BulkCourseRowProps {
  course: AdminCourse;
  checked: boolean;
  onToggle: (id: string) => void;
}

const THUMB_WIDTH = 52;
const THUMB_HEIGHT = 36;
const ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  px: 2,
  py: 0.75,
  minHeight: 52,
  cursor: 'pointer',
  borderBottom: 1,
  borderColor: 'divider',
  '&:hover': { bgcolor: 'action.hover' },
} as const;

/** One selectable course in the bulk dialog (the whole row is the checkbox's label). */
export const BulkCourseRow: FC<BulkCourseRowProps> = ({ course, checked, onToggle }) => {
  const { t } = useTranslation();
  const titleId = useId();
  const published = course.status === 'Published';
  return (
    <Box component="label" sx={{ ...ROW_SX, bgcolor: checked ? 'action.selected' : 'transparent' }}>
      <Checkbox
        checked={checked}
        onChange={() => {
          onToggle(course._id);
        }}
        slotProps={{ input: { 'aria-labelledby': titleId } }}
        sx={{ flexShrink: 0 }}
      />
      <Box
        sx={{ width: THUMB_WIDTH, borderRadius: 0.5, overflow: 'hidden', flexShrink: 0 }}
        aria-hidden
      >
        <CourseCover
          src={course.coverImage}
          alt=""
          height={THUMB_HEIGHT}
          sizes={`${THUMB_WIDTH}px`}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography id={titleId} variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {course.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3, alignItems: 'center', minWidth: 0 }}>
          <Chip
            label={t(`adminCourses.values.${course.status}`)}
            size="small"
            color={published ? 'success' : 'default'}
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
          />
          {course.courseType && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {course.courseType.name}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};
