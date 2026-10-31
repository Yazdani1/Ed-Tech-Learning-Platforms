'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { Course } from '@/schemas/browse.schema';

interface CourseEditorActionsProps {
  course: Course | undefined;
  isSaving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

const BUTTON_SX = { minHeight: 44 };

/** Preview / View Live (saved courses), Save Draft and Publish. */
export const CourseEditorActions: FC<CourseEditorActionsProps> = ({
  course,
  isSaving,
  onSaveDraft,
  onPublish,
}) => {
  const { t } = useTranslation();
  const isPublished = course?.status === 'Published';
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {course && (
        <Button
          component="a"
          href={`/courses/${course._id}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          color={isPublished ? 'success' : 'inherit'}
          startIcon={isPublished ? <OpenInNewIcon /> : <VisibilityIcon />}
          sx={BUTTON_SX}
        >
          {t(isPublished ? 'catalog.editor.viewLive' : 'catalog.editor.preview')}
        </Button>
      )}
      <Button variant="outlined" onClick={onSaveDraft} disabled={isSaving} sx={BUTTON_SX}>
        {isSaving ? (
          <CircularProgress size={18} aria-label={t('common.saving')} />
        ) : (
          t('catalog.editor.saveDraft')
        )}
      </Button>
      <Button variant="contained" onClick={onPublish} disabled={isSaving} sx={BUTTON_SX}>
        {t('common.publish')}
      </Button>
    </Box>
  );
};
