'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { htmlToPlainText } from '@/utils/html-text';

import { CourseTypeBadge } from './CourseTypeBadge';
import { PlanChips } from './PlanChips';
import { PreviewLearnList } from './PreviewLearnList';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CoursePreviewPopoverProps {
  course: Course;
  anchor: HTMLElement | null;
  href: string;
  onClose: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

const clamp = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }) as const;
const PAPER_SX = {
  pointerEvents: 'auto',
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 4px 16px rgba(15,23,42,0.1)',
} as const;

/** Desktop hover card next to a course card: summary, what you'll learn, subscription plans, View Details. */
export const CoursePreviewPopover: FC<CoursePreviewPopoverProps> = ({
  course,
  anchor,
  href,
  onClose,
  onPointerEnter,
  onPointerLeave,
}) => {
  const { t } = useTranslation();
  const description = htmlToPlainText(course.description);
  const hasPlans = course.includedInSubscription && course.allowedSubscriptionPlans.length > 0;

  return (
    <Popover
      open={anchor !== null}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      disableRestoreFocus
      disableScrollLock
      transitionDuration={0}
      sx={{ pointerEvents: 'none', ml: 1 }}
      slotProps={{
        paper: { onMouseEnter: onPointerEnter, onMouseLeave: onPointerLeave, sx: PAPER_SX },
      }}
    >
      <Box sx={{ width: 320, maxWidth: 'calc(100vw - 32px)', p: 2 }}>
        <Typography sx={{ fontWeight: 800, lineHeight: 1.25, mb: 1, ...clamp(2) }}>
          {course.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.25 }}>
          {course.category && <Chip label={course.category.name} size="small" />}
          {course.courseType && <CourseTypeBadge name={course.courseType.name} />}
        </Box>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, ...clamp(3) }}>
            {description}
          </Typography>
        )}
        <PreviewLearnList items={course.whatYouWillLearn} />
        {hasPlans && <PlanChips plans={course.allowedSubscriptionPlans} />}
        <Button
          component={Link}
          href={href}
          fullWidth
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{ fontWeight: 800, borderRadius: 1, minHeight: 44 }}
        >
          {t('browse.card.viewDetails')}
        </Button>
      </Box>
    </Popover>
  );
};
