'use client';

import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface HeroBreadcrumbsProps {
  course: Course;
}

const LIGHT = '#cbd5e1';

/** Home > category > course type, on the dark banner. */
export const HeroBreadcrumbs: FC<HeroBreadcrumbsProps> = ({ course }) => {
  const { t } = useTranslation();
  return (
    <Breadcrumbs
      aria-label={t('browse.detail.breadcrumb')}
      separator={<NavigateNextIcon sx={{ fontSize: 16 }} aria-hidden />}
      sx={{ mb: 2.5, color: '#94a3b8', '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
    >
      <Box
        component={Link}
        href="/"
        sx={{ color: LIGHT, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
      >
        {t('browse.detail.home')}
      </Box>
      {course.category && <Box sx={{ color: LIGHT }}>{course.category.name}</Box>}
      {course.courseType && (
        <Box sx={{ color: 'common.white', fontWeight: 600 }}>{course.courseType.name}</Box>
      )}
    </Breadcrumbs>
  );
};
