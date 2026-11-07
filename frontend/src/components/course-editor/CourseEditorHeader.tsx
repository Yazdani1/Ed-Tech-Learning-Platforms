'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { PAGE_TITLE_SX } from '@/components/common/PageHeader';
import { COURSE_STATUS_COLOR, courseStatusLabel } from '@/utils/course-status';
import { formatDateTime } from '@/utils/dateTime';

import { CourseEditorActions } from './CourseEditorActions';

import type { FC } from 'react';
import type { Course } from '@/schemas/browse.schema';

interface CourseEditorHeaderProps {
  /** The saved course; undefined while creating */
  course: Course | undefined;
  title: string;
  isSaving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSave: () => void;
}

const ROW_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
} as const;

/** Back link, title, Draft / Archived / Published chips and the save actions. */
export const CourseEditorHeader: FC<CourseEditorHeaderProps> = ({ course, title, ...actions }) => {
  const { t, i18n } = useTranslation();
  const isPublished = course?.status === 'Published';

  return (
    <Box sx={{ mb: 3 }}>
      <Button
        component={Link}
        href="/admin/courses"
        startIcon={<ArrowBackIosNewIcon fontSize="small" />}
        sx={{ fontWeight: 800, mb: 1.5, minHeight: 44 }}
      >
        {t('catalog.editor.back')}
      </Button>
      <Box sx={ROW_SX}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" sx={{ ...PAGE_TITLE_SX, wordBreak: 'break-word' }}>
            {title}
          </Typography>
          {course && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
              <Chip
                label={t(`adminCourses.values.${courseStatusLabel(course)}`)}
                size="small"
                color={COURSE_STATUS_COLOR[courseStatusLabel(course)]}
                sx={{ fontWeight: 800 }}
              />
              {isPublished && course.publishedAt && (
                <Chip
                  label={t('catalog.editor.publishedOn', {
                    date: formatDateTime(course.publishedAt, i18n.language),
                  })}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Box>
        <CourseEditorActions course={course} {...actions} />
      </Box>
    </Box>
  );
};
