'use client';

import PublicIcon from '@mui/icons-material/Public';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/hooks/useConfirm';

import { FormSelect } from '../details/FormSelect';

import type { CourseDetailsEditor } from '../useCourseDetailsForm';
import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface SettingsTabProps {
  course: Course;
  details: CourseDetailsEditor;
}

const FORM_MAX_WIDTH = 720;
const CARD_SX = { p: { xs: 2, sm: 3 }, borderRadius: 2 } as const;

/**
 * Course settings: visibility, and publish / unpublish. An unpublished course leaves the home page and the
 * catalog, but enrolled students keep learning it; a course that was ever published can never be deleted.
 */
export const SettingsTab: FC<SettingsTabProps> = ({ course, details }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const isPublished = course.status === 'Published';

  const toggle = async (): Promise<void> => {
    if (isPublished) {
      const ok = await confirm({
        title: t('catalog.settings.unpublishTitle'),
        message: t('catalog.settings.unpublishMessage', { title: course.title }),
        confirmLabel: t('catalog.settings.unpublish'),
        destructive: true,
      });
      if (!ok) return;
    }
    details.save(isPublished ? 'Draft' : 'Published');
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: FORM_MAX_WIDTH }}>
      <Paper variant="outlined" sx={CARD_SX}>
        <Typography component="h3" sx={{ fontWeight: 700, mb: 2 }}>
          {t('catalog.settings.visibilityTitle')}
        </Typography>
        <FormSelect
          control={details.form.control}
          name="visibility"
          label={t('catalog.basic.visibility')}
          options={[
            { value: 'Public', label: t('catalog.basic.public') },
            { value: 'Private', label: t('catalog.basic.private') },
          ]}
        />
      </Paper>
      <Paper variant="outlined" sx={CARD_SX}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {isPublished ? <PublicIcon color="success" /> : <PublicOffIcon color="disabled" />}
          <Typography component="h3" sx={{ fontWeight: 700 }}>
            {t(isPublished ? 'catalog.settings.publishedTitle' : 'catalog.settings.draftTitle')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(isPublished ? 'catalog.settings.unpublishHelp' : 'catalog.settings.publishHelp')}
        </Typography>
        <Button
          variant={isPublished ? 'outlined' : 'contained'}
          color={isPublished ? 'error' : 'primary'}
          onClick={() => void toggle()}
          disabled={details.isSaving}
          sx={{ minHeight: 44 }}
        >
          {t(isPublished ? 'catalog.settings.unpublish' : 'common.publish')}
        </Button>
      </Paper>
      {course.firstPublishedAt && (
        <Alert severity="info">{t('catalog.settings.neverDeleted')}</Alert>
      )}
    </Stack>
  );
};
