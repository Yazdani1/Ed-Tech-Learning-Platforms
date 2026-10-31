'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';

import { CourseCover } from '@/components/course-card/CourseCover';

import { TeacherCourseFooter } from './TeacherCourseFooter';
import { TeacherCourseSummary } from './TeacherCourseSummary';

import type { TeacherCourse } from '@/schemas/teacher.schema';
import type { FC } from 'react';

const COVER_WIDTH = 188;
const COVER_MIN_HEIGHT = 210;
const COVER_SIZES = `${COVER_WIDTH}px`;

interface TeacherCourseCardProps {
  course: TeacherCourse;
  onShowStudents: (course: TeacherCourse) => void;
}

/** One assigned course: cover (tablet and up), summary, teachers and the View / Students actions. */
export const TeacherCourseCard: FC<TeacherCourseCardProps> = ({ course, onShowStudents }) => (
  <Paper
    component="article"
    variant="outlined"
    aria-label={course.title}
    sx={{ height: '100%', display: 'flex', overflow: 'hidden' }}
  >
    <Box
      sx={{
        width: COVER_WIDTH,
        minHeight: COVER_MIN_HEIGHT,
        flexShrink: 0,
        display: { xs: 'none', sm: 'block' },
      }}
    >
      <CourseCover src={course.coverImage} alt="" height="100%" sizes={COVER_SIZES} />
    </Box>
    <Box sx={{ p: 2.5, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <TeacherCourseSummary course={course} />
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ my: 2 }} />
      <TeacherCourseFooter course={course} onShowStudents={onShowStudents} />
    </Box>
  </Paper>
);
