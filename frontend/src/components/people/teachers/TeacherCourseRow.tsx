'use client';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { THUMB_WIDTH, TeacherCourseThumb } from './TeacherCourseThumb';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface TeacherCourseRowProps {
  course: AdminCourse;
}

/** One course in the teacher details: cover, title, type and category, status, students, View Course. */
export const TeacherCourseRow: FC<TeacherCourseRowProps> = ({ course }) => {
  const { t } = useTranslation();
  const students = course.enrollmentStats?.totalEnrollments ?? 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: `${THUMB_WIDTH}px 1fr auto` },
        gap: 1.5,
        alignItems: 'center',
      }}
    >
      <TeacherCourseThumb coverImage={course.coverImage} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
          {course.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {course.courseType?.name ?? t('people.teachers.noCourseType')} ·{' '}
          {course.category?.name ?? t('people.teachers.noCategory')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          label={course.status}
          size="small"
          color={course.status === 'Published' ? 'success' : 'default'}
          variant="outlined"
        />
        {course.visibility && <Chip label={course.visibility} size="small" />}
        <Chip
          label={t('people.teachers.studentCount', { count: students })}
          size="small"
          variant="outlined"
        />
        <Button
          component={Link}
          href={`/admin/courses/${encodeURIComponent(course._id)}/learn`}
          size="small"
          variant="contained"
          startIcon={<VisibilityOutlinedIcon />}
          sx={{ minHeight: 44 }}
        >
          {t('people.teachers.viewCourse')}
        </Button>
      </Box>
    </Paper>
  );
};
