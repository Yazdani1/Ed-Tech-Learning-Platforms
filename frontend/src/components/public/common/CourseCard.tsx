'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { CourseCardBody } from '@/components/course-card/CourseCardBody';
import { CourseCover } from '@/components/course-card/CourseCover';

import type { CourseCardData } from '@/schemas/public.schema';
import type { FC } from 'react';

interface CourseCardProps {
  course: CourseCardData;
  /** The signed-in Student is enrolled: show "Continue Learning" */
  isEnrolled?: boolean;
}

const CARD_SX = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 1,
  border: 1,
  borderColor: 'divider',
} as const;

/** Course preview that opens the course page; enrolled Students also get "Continue Learning". */
export const CourseCard: FC<CourseCardProps> = ({ course, isEnrolled = false }) => {
  const { t } = useTranslation();
  return (
    <Card elevation={0} sx={CARD_SX}>
      <CardActionArea
        component={Link}
        href={`/courses/${course._id}`}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CourseCover src={course.coverImage} alt="" />
        <CourseCardBody
          course={course}
          eyebrow={
            course.courseType && (
              <Typography
                variant="caption"
                color="primary"
                sx={{ fontWeight: 800, textTransform: 'uppercase' }}
              >
                {course.courseType.name}
              </Typography>
            )
          }
        />
      </CardActionArea>
      {isEnrolled && (
        <Box sx={{ p: 1.5, pt: 0 }}>
          <Button
            component={Link}
            href={`/student/courses/${course._id}/learn`}
            fullWidth
            variant="contained"
            color="success"
            sx={{ minHeight: 44 }}
          >
            {t('public.courses.continue')}
          </Button>
        </Box>
      )}
    </Card>
  );
};
