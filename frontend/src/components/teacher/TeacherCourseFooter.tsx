'use client';

import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { teacherLearnPath, teacherNames } from './teacherCourse.utils';

import type { TeacherCourse } from '@/schemas/teacher.schema';
import type { FC } from 'react';

interface TeacherCourseFooterProps {
  course: TeacherCourse;
  onShowStudents: (course: TeacherCourse) => void;
}

/** Assigned teachers and the Students (dialog) / View (course player) actions. */
export const TeacherCourseFooter: FC<TeacherCourseFooterProps> = ({ course, onShowStudents }) => {
  const { t } = useTranslation();
  const teachers = teacherNames(course);
  return (
    <>
      <Box sx={{ minWidth: 0, mb: 1.5 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 800, textTransform: 'uppercase' }}
        >
          {t('teacher.assignedTeachers')}
        </Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
          {teachers || t('teacher.noTeachers')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<PeopleOutlined />}
          onClick={() => {
            onShowStudents(course);
          }}
          aria-label={t('teacher.studentsAria', { title: course.title })}
          sx={{ minHeight: 44 }}
        >
          {t('teacher.students')}
        </Button>
        <Button
          component={Link}
          href={teacherLearnPath(course._id)}
          variant="contained"
          startIcon={<VisibilityOutlined />}
          aria-label={t('teacher.viewAria', { title: course.title })}
          sx={{ minHeight: 44 }}
        >
          {t('teacher.view')}
        </Button>
      </Box>
    </>
  );
};
