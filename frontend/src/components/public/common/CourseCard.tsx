'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';

import { CourseCardPrice } from './CourseCardPrice';
import { CourseStartDay } from './CourseStartDay';

import type { CourseCardData } from '@/schemas/public.schema';
import type { FC } from 'react';

interface CourseCardProps {
  course: CourseCardData;
  /** The signed-in Student is enrolled: show "Continue Learning" */
  isEnrolled?: boolean;
}

const COVER_HEIGHT = 200;
const COVER_SIZES = '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 400px';
const CARD_SX = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '20px',
  border: '1px solid #eef1f5',
  overflow: 'hidden',
  boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  '& img': { transition: 'transform 0.4s ease' },
  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 36px rgba(15,23,42,0.14)' },
  '&:hover img': { transform: 'scale(1.05)' },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover': { transform: 'none' },
    '&:hover img': { transform: 'none' },
  },
} as const;
const TITLE_SX = {
  fontWeight: 600,
  fontSize: '1.2rem',
  lineHeight: 1.4,
  minHeight: '2.8em',
  overflowWrap: 'anywhere',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;
const TYPE_SX = {
  px: 1.25,
  py: 0.5,
  minWidth: 0,
  borderRadius: 99,
  bgcolor: '#dbe4ff',
  color: '#1e3a8a',
  fontSize: '0.8rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;
const DETAILS_SX = {
  minHeight: 52,
  fontWeight: 700,
  fontSize: '1rem',
  borderRadius: '12px',
  background: 'linear-gradient(100deg, #0b4fc4 0%, #2563eb 50%, #0b4fc4 100%)',
} as const;

/** Home / pricing course card: cover, type, start day, title, price with its saving and "See Details". */
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
          <CourseCover src={course.coverImage} alt="" height={COVER_HEIGHT} sizes={COVER_SIZES} />
        </Box>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            {course.courseType && <Box sx={TYPE_SX}>{course.courseType.name}</Box>}
            <CourseStartDay startDate={course.startDate} />
          </Box>
          <Typography component="h3" sx={TITLE_SX}>
            {course.title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <CourseCardPrice course={course} />
        </Box>
      </CardActionArea>
      <Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          component={Link}
          href={href}
          fullWidth
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          aria-label={t('public.courses.seeDetailsOf', { title: course.title })}
          sx={DETAILS_SX}
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
            sx={{ minHeight: 44, borderRadius: '12px' }}
          >
            {t('public.courses.continue')}
          </Button>
        )}
      </Box>
    </Card>
  );
};
