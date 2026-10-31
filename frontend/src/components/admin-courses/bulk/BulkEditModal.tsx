'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { useReferenceOptions } from '../list/useReferenceOptions';

import { BulkCourseSelector } from './BulkCourseSelector';
import { BulkEditPanel } from './BulkEditPanel';
import { useBulkEdit } from './useBulkEdit';
import { useBulkSelection } from './useBulkSelection';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface BulkEditModalProps {
  open: boolean;
  /** The courses of the list behind the dialog (its filters apply) */
  courses: AdminCourse[];
  onClose: () => void;
}

const LAYOUT_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '2fr 3fr' },
  gap: { xs: 2, md: 0 },
  mx: { xs: -2, sm: -3 },
  my: -2,
} as const;

/**
 * Bulk edit (Super Admin, Admin): pick courses on the left (stacked on top on phones), then update fields,
 * run a discount campaign or post one announcement to all of them.
 */
export const BulkEditModal: FC<BulkEditModalProps> = ({ open, courses, onClose }) => {
  const { t } = useTranslation();
  const options = useReferenceOptions();
  const selection = useBulkSelection(courses);
  const form = useBulkEdit();
  const count = selection.selectedIds.size;

  const save = async (): Promise<void> => {
    if (await form.submit([...selection.selectedIds])) onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      maxWidth="xl"
      title={
        <Box component="span" sx={{ display: 'block' }}>
          <Typography component="span" variant="h6" sx={{ fontWeight: 700, display: 'block' }}>
            {t('adminCourses.bulk.title')}
          </Typography>
          <Typography component="span" variant="caption" color="text.secondary">
            {t('adminCourses.bulk.subtitle')}
          </Typography>
        </Box>
      }
      onSave={() => void save()}
      saving={form.submitting}
      saveDisabled={count === 0}
      saveLabel={
        count > 0 ? t('adminCourses.bulk.apply', { count }) : t('adminCourses.bulk.applyNone')
      }
      actionsLeft={
        <Chip
          label={
            count > 0
              ? t('adminCourses.bulk.selectedCourses', { count })
              : t('adminCourses.bulk.noneSelected')
          }
          color={count > 0 ? 'primary' : 'default'}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      }
    >
      <Box sx={LAYOUT_SX}>
        <Box
          sx={{ borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider' }}
        >
          <BulkCourseSelector selection={selection} options={options} />
        </Box>
        <BulkEditPanel form={form} options={options} selectedCount={count} />
      </Box>
    </AppModal>
  );
};
