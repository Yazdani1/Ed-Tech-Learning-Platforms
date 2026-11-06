'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Link from 'next/link';

import { CourseCardBody } from '@/components/course-card/CourseCardBody';
import { CourseCover } from '@/components/course-card/CourseCover';

import { CourseBadges } from './CourseBadges';
import { learnPath } from './enrolledCourse.utils';

import type { EnrolledCourse } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface EnrolledCourseCardProps {
  course: EnrolledCourse;
}

/** One enrolled course: opens the course player (enrolments cannot be removed). */
export const EnrolledCourseCard: FC<EnrolledCourseCardProps> = ({ course }) => (
  <Card
    variant="outlined"
    sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    <CardActionArea
      component={Link}
      href={learnPath(course._id)}
      sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
    >
      <Box sx={{ position: 'relative' }}>
        <CourseCover src={course.coverImage} alt={course.title} />
        <CourseBadges course={course} />
      </Box>
      <CourseCardBody course={course} />
    </CardActionArea>
  </Card>
);
