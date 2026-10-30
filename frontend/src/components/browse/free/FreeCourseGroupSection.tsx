'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { CourseGrid, type GridSize } from '../card/CourseGrid';

import { UNTYPED_GROUP_ID, type FreeCourseGroup } from './group-free-courses';

import type { FC } from 'react';

interface FreeCourseGroupSectionProps {
  group: FreeCourseGroup;
  enrolledIds: readonly string[];
}

/** Cards shown per course type; "See all" opens the catalog filtered to that type and Free. */
export const FREE_COURSES_PER_TYPE = 6;
const GRID_SIZE: GridSize = { xs: 12, sm: 6, md: 4 };

/** One course type on the free-courses page: title, description, count, up to six cards. */
export const FreeCourseGroupSection: FC<FreeCourseGroupSectionProps> = ({ group, enrolledIds }) => {
  const { t } = useTranslation();
  const name = group.name ?? t('browse.free.otherGroup');
  const hasMore = group.courses.length > FREE_COURSES_PER_TYPE && group.id !== UNTYPED_GROUP_ID;
  const seeAllHref = `/courses?${new URLSearchParams({ courseTypes: group.id, pricing: 'Free' }).toString()}`;

  return (
    <Box component="section" aria-label={name}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 800 }}>
          {name}
        </Typography>
        {group.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 680, mx: 'auto' }}
          >
            {group.description}
          </Typography>
        )}
        <Chip
          label={t('browse.free.groupCount', { count: group.courses.length })}
          size="small"
          color="success"
          sx={{ mt: 1.25, fontWeight: 700 }}
        />
      </Box>
      <CourseGrid
        courses={group.courses.slice(0, FREE_COURSES_PER_TYPE)}
        enrolledIds={enrolledIds}
        size={GRID_SIZE}
      />
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            component={Link}
            href={seeAllHref}
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            sx={{ fontWeight: 800, minHeight: 44 }}
          >
            {t('browse.free.seeAll', { name })}
          </Button>
        </Box>
      )}
    </Box>
  );
};
