'use client';

import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface CourseListActionsProps {
  onBulkEdit: () => void;
  /** Nothing to bulk edit while the list is empty */
  bulkDisabled: boolean;
}

/** Super Admin / Admin page buttons: Bulk Edit and Create Course. */
export const CourseListActions: FC<CourseListActionsProps> = ({ onBulkEdit, bulkDisabled }) => {
  const { t } = useTranslation();
  return (
    <>
      <Button
        variant="outlined"
        startIcon={<TuneIcon />}
        onClick={onBulkEdit}
        disabled={bulkDisabled}
        sx={{ minHeight: 44 }}
      >
        {t('adminCourses.bulkEdit')}
      </Button>
      <Button
        component={Link}
        href="/admin/courses/create"
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ minHeight: 44 }}
      >
        {t('adminCourses.createCourse')}
      </Button>
    </>
  );
};
