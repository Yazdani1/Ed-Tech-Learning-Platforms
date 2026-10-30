'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { CourseCardBody } from '@/components/course-card/CourseCardBody';
import { CourseCover } from '@/components/course-card/CourseCover';

import { CourseTypeBadge } from './CourseTypeBadge';
import { CoursePreviewPopover } from './CoursePreviewPopover';
import { useHoverPreview } from './useHoverPreview';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseCardProps {
  course: Course;
  /** The signed-in student is enrolled: show "Go to this course" */
  isEnrolled?: boolean;
}

const CARD_SX = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden',
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  '&:hover': { boxShadow: '0 4px 14px rgba(15,23,42,0.1)', transform: 'translateY(-2px)' },
} as const;

/** A course in the catalog: a link to its page; mouse users also get a hover preview. */
export const CourseCard: FC<CourseCardProps> = ({ course, isEnrolled = false }) => {
  const { t } = useTranslation();
  const preview = useHoverPreview();
  const href = `/courses/${course._id}`;

  return (
    <>
      <Card
        elevation={0}
        onMouseEnter={(event) => {
          preview.open(event.currentTarget);
        }}
        onMouseLeave={preview.close}
        sx={CARD_SX}
      >
        <CardActionArea
          component={Link}
          href={href}
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          <Box sx={{ position: 'relative' }}>
            <CourseCover src={course.coverImage} alt={course.title} />
            {course.courseType && <CourseTypeBadge name={course.courseType.name} overlay />}
          </Box>
          <CourseCardBody course={course} />
        </CardActionArea>
        {isEnrolled && (
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            <Button
              component={Link}
              href={`/student/courses/${course._id}/learn`}
              fullWidth
              variant="contained"
              color="success"
              sx={{ minHeight: 44, fontWeight: 700, borderRadius: 1 }}
            >
              {t('browse.card.goToCourse')}
            </Button>
          </Box>
        )}
      </Card>
      {preview.enabled && (
        <CoursePreviewPopover
          course={course}
          anchor={preview.anchor}
          href={href}
          onClose={preview.closeNow}
          onPointerEnter={preview.keepOpen}
          onPointerLeave={preview.close}
        />
      )}
    </>
  );
};
