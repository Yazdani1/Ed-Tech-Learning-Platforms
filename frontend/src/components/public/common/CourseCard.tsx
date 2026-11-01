'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';
import { CoursePrice } from '@/components/course-card/CoursePrice';

import { CourseStartDay } from './CourseStartDay';

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
  borderRadius: 2,
  border: 1,
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
  '& img': { transition: 'transform 0.4s ease' },
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 36px rgba(15,23,42,0.14)',
    borderColor: 'primary.light',
  },
  '&:hover img': { transform: 'scale(1.06)' },
  '&:hover .course-card-title': { color: 'primary.main' },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover': { transform: 'none' },
    '&:hover img': { transform: 'none' },
  },
} as const;
const TITLE_SX = {
  fontWeight: 800,
  fontSize: '0.95rem',
  lineHeight: 1.35,
  overflowWrap: 'anywhere',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  transition: 'color 0.25s ease',
} as const;

/** Home / pricing course card: cover, type, title, start day, price and "See Details" (lifts on hover). */
export const CourseCard: FC<CourseCardProps> = ({ course, isEnrolled = false }) => {
  const { t } = useTranslation();
  const href = `/courses/${course._id}`;
  return (
    <Card elevation={0} sx={CARD_SX}>
      <CardActionArea
        component={Link}
        href={href}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <CourseCover src={course.coverImage} alt="" />
        </Box>
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 0.75 }}>
          {course.courseType && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ fontWeight: 800, textTransform: 'uppercase' }}
            >
              {course.courseType.name}
            </Typography>
          )}
          <Typography component="h3" className="course-card-title" sx={TITLE_SX}>
            {course.title}
          </Typography>
          <CourseStartDay startDate={course.startDate} />
          <Box sx={{ flexGrow: 1 }} />
          <CoursePrice course={course} />
        </Box>
      </CardActionArea>
      <Box sx={{ p: 1.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          component={Link}
          href={href}
          fullWidth
          variant={isEnrolled ? 'outlined' : 'contained'}
          aria-label={t('public.courses.seeDetailsOf', { title: course.title })}
          sx={{ minHeight: 44, fontWeight: 700 }}
        >
          {t('public.courses.seeDetails')}
        </Button>
        {isEnrolled && (
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
        )}
      </Box>
    </Card>
  );
};
