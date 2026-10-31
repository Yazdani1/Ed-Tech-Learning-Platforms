'use client';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { ManagerCourseButtons } from './ManagerCourseButtons';

import type { FC, ReactNode } from 'react';

interface CourseCardFooterProps {
  courseId: string;
  teacherNames: string;
  /** Managers get icon buttons (student view + edit); Moderators a "View" button */
  canManage: boolean;
  menu: ReactNode;
}

/** Teachers of the course and the card's actions. */
export const CourseCardFooter: FC<CourseCardFooterProps> = ({
  courseId,
  teacherNames,
  canManage,
  menu,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}
        >
          {t('adminCourses.list.teachers')}
        </Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
          {teacherNames || t('adminCourses.list.noTeachers')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {canManage ? (
          <ManagerCourseButtons courseId={courseId} />
        ) : (
          <Button
            component={Link}
            href={`/admin/courses/${courseId}/learn`}
            variant="contained"
            size="small"
            startIcon={<VisibilityOutlinedIcon />}
            sx={{ fontWeight: 800, minHeight: 44 }}
          >
            {t('adminCourses.list.view')}
          </Button>
        )}
        {menu}
      </Box>
    </Box>
  );
};
