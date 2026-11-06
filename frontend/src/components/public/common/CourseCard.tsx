'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { BatchNumberChip } from '@/components/course-card/BatchNumberChip';
import { CourseCover } from '@/components/course-card/CourseCover';

import { COURSE_CARD_SX } from './course-card-styles';
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
const DETAILS_SX = {
  minHeight: 52,
  fontWeight: 700,
  fontSize: '1rem',
  borderRadius: '12px',
  background: 'linear-gradient(100deg, #0b4fc4 0%, #2563eb 50%, #0b4fc4 100%)',
} as const;

/** Home / pricing course card: cover, batch number and start date, title, price with its saving and "See Details". */
export const CourseCard: FC<CourseCardProps> = ({ course, isEnrolled = false }) => {
  const { t } = useTranslation();
  const href = `/courses/${course._id}`;
  return (
    <Card elevation={0} sx={COURSE_CARD_SX}>
      <CardActionArea
        component={Link}
        href={href}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <CourseCover src={course.coverImage} alt="" height={COVER_HEIGHT} sizes={COVER_SIZES} />
        </Box>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <BatchNumberChip batchNumber={course.batchNumber} />
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
