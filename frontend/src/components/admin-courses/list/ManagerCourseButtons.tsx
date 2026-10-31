'use client';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ManagerCourseButtonsProps {
  courseId: string;
}

const ICON_SIZE = { width: 44, height: 44 } as const;

/** Super Admin / Admin card buttons: the course player (student view) and the course editor. */
export const ManagerCourseButtons: FC<ManagerCourseButtonsProps> = ({ courseId }) => {
  const { t } = useTranslation();
  return (
    <>
      <Tooltip title={t('adminCourses.list.studentView')}>
        <IconButton
          component={Link}
          href={`/admin/courses/${courseId}/learn`}
          aria-label={t('adminCourses.list.studentView')}
          sx={ICON_SIZE}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('adminCourses.list.editCourse')}>
        <IconButton
          component={Link}
          href={`/admin/courses/${courseId}/edit`}
          aria-label={t('adminCourses.list.editCourse')}
          sx={ICON_SIZE}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};
