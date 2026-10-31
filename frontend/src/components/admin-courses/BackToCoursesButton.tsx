'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

/** "Back to Courses" link to /admin/courses (course details and enrolments pages). */
export const BackToCoursesButton = () => {
  const { t } = useTranslation();
  return (
    <Button
      component={Link}
      href="/admin/courses"
      startIcon={<ArrowBackIosNewIcon fontSize="small" />}
      sx={{ mb: 2, minHeight: 44, fontWeight: 800 }}
    >
      {t('adminCourses.enrollments.back')}
    </Button>
  );
};
