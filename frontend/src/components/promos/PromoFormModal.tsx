'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { CourseMultiSelect } from '@/components/course-select/CourseMultiSelect';

import { PromoDetailsFields } from './PromoDetailsFields';
import { usePromoForm } from './usePromoForm';

import type { Promo } from '@/schemas/promo.schema';
import type { FC } from 'react';

interface PromoFormModalProps {
  open: boolean;
  promo: Promo | undefined;
  onClose: () => void;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 3fr) minmax(0, 2fr)' },
  gap: 3,
  pt: 1,
} as const;

/**
 * Large dialog: published paid courses to include (filters, search, select all) on the left; the promo's
 * title, code (a free one is suggested), percent or amount and start / end on the right.
 */
export const PromoFormModal: FC<PromoFormModalProps> = ({ open, promo, onClose }) => {
  const { t } = useTranslation();
  const { form, submit, saving, error } = usePromoForm(open, promo, onClose);
  const courseError = form.formState.errors.courseIds;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(promo ? 'promos.edit' : 'promos.add')}
      onSave={submit}
      saveLabel={promo ? t('common.update') : t('promos.launch')}
      saving={saving}
      maxWidth="lg"
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      <Box sx={GRID_SX}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3" sx={{ fontWeight: 700, mb: 1.5 }}>
            {t('promos.courses.title')}
          </Typography>
          <Controller
            control={form.control}
            name="courseIds"
            render={({ field }) => (
              <CourseMultiSelect value={field.value} onChange={field.onChange} paidOnly />
            )}
          />
          {courseError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {t(courseError.message ?? 'promos.validation.courses')}
            </Typography>
          )}
        </Box>
        <PromoDetailsFields form={form} />
      </Box>
    </AppModal>
  );
};
