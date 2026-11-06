'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { CourseMultiSelect } from '@/components/course-select/CourseMultiSelect';

import { BroadcastFields } from './BroadcastFields';
import { useBroadcastForm } from './useBroadcastForm';

import type { FC } from 'react';

interface BroadcastFormModalProps {
  onClose: () => void;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
  gap: 3,
  pt: 1,
} as const;

/**
 * Large dialog (mounted only while open): published courses to send to (filters by visibility, pricing,
 * category; several at once) on the left; title, text and an optional picture on the right.
 */
export const BroadcastFormModal: FC<BroadcastFormModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const state = useBroadcastForm(onClose);
  const courseError = state.form.formState.errors.courseIds;
  return (
    <AppModal
      open
      onClose={onClose}
      title={t('announcements.add')}
      onSave={state.submit}
      saveLabel={t('announcements.send')}
      saving={state.sending}
      maxWidth="lg"
    >
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error.message}
        </Alert>
      )}
      <Box sx={GRID_SX}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3" sx={{ fontWeight: 700, mb: 1.5 }}>
            {t('announcements.coursesTitle')}
          </Typography>
          <Controller
            control={state.form.control}
            name="courseIds"
            render={({ field }) => (
              <CourseMultiSelect value={field.value} onChange={field.onChange} />
            )}
          />
          {courseError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {t(courseError.message ?? 'promos.validation.courses')}
            </Typography>
          )}
        </Box>
        <BroadcastFields state={state} />
      </Box>
    </AppModal>
  );
};
