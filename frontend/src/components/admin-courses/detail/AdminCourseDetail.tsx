'use client';

import Box from '@mui/material/Box';

import { CourseDetailView } from '@/components/browse/detail/CourseDetailView';

import { BackToCoursesButton } from '../BackToCoursesButton';

import type { FC } from 'react';

interface AdminCourseDetailProps {
  courseId: string;
}

/**
 * /admin/courses/[id]: the course page as staff see it (drafts and private courses included; the side card
 * offers Edit to Super Admin / Admin and the student view to all staff), with a way back to the list.
 */
export const AdminCourseDetail: FC<AdminCourseDetailProps> = ({ courseId }) => (
  <Box>
    <BackToCoursesButton />
    <CourseDetailView courseId={courseId} />
  </Box>
);
