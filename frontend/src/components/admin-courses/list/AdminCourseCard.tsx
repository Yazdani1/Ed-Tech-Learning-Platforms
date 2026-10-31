'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';

import { CourseTypeBadge } from '@/components/browse/card/CourseTypeBadge';
import { CourseCover } from '@/components/course-card/CourseCover';

import { CourseCardChips } from './CourseCardChips';
import { CourseCardFooter } from './CourseCardFooter';
import { CourseCardHeading } from './CourseCardHeading';
import { CourseCardStats } from './CourseCardStats';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC, ReactNode } from 'react';

interface AdminCourseCardProps {
  course: AdminCourse;
  /** Super Admin / Admin: status, monthly figures, edit button */
  canManage: boolean;
  menu: ReactNode;
}

const COVER_WIDTH = 190;
const CARD_MIN_HEIGHT = 232;
const COVER_SX = {
  width: COVER_WIDTH,
  flexShrink: 0,
  position: 'relative',
  display: { xs: 'none', sm: 'block' },
} as const;

/** One course of the staff list: cover (from 600 px), title, chips, figures, teachers, actions. */
export const AdminCourseCard: FC<AdminCourseCardProps> = ({ course, canManage, menu }) => {
  const teacherNames = course.teachers
    .flatMap((teacher) => (teacher ? [teacher.name] : []))
    .join(', ');

  return (
    <Paper variant="outlined" component="article" sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', minHeight: CARD_MIN_HEIGHT, height: '100%' }}>
        <Box sx={COVER_SX}>
          <CourseCover src={course.coverImage} alt="" height="100%" sizes={`${COVER_WIDTH}px`} />
          {course.courseType && <CourseTypeBadge name={course.courseType.name} overlay />}
        </Box>
        <Box sx={{ p: 2.5, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <CourseCardHeading course={course} showStatus={canManage} />
          <CourseCardChips course={course} showPrice={canManage} />
          {canManage && <CourseCardStats course={course} />}
          <Box sx={{ flexGrow: 1 }} />
          <Divider sx={{ my: 2 }} />
          <CourseCardFooter
            courseId={course._id}
            teacherNames={teacherNames}
            canManage={canManage}
            menu={menu}
          />
        </Box>
      </Box>
    </Paper>
  );
};
