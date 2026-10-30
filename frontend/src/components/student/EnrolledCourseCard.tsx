'use client';

import DeleteOutline from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { CourseCardBody } from '@/components/course-card/CourseCardBody';
import { CourseCover } from '@/components/course-card/CourseCover';

import { CourseBadges } from './CourseBadges';
import { learnPath } from './enrolledCourse.utils';

import type { EnrolledCourse } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface EnrolledCourseCardProps {
  course: EnrolledCourse;
  onRemove: (course: EnrolledCourse) => void;
  removing?: boolean;
}

/** One enrolled course: opens the course player; the bin button removes the enrolment. */
export const EnrolledCourseCard: FC<EnrolledCourseCardProps> = ({ course, onRemove, removing }) => {
  const { t } = useTranslation();
  return (
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
      <Tooltip title={t('student.removeTooltip')}>
        <IconButton
          aria-label={t('student.removeAria', { title: course.title })}
          onClick={() => {
            onRemove(course);
          }}
          disabled={removing}
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 44,
            height: 44,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'error.light', color: 'common.white' },
          }}
        >
          <DeleteOutline fontSize="small" />
        </IconButton>
      </Tooltip>
    </Card>
  );
};
