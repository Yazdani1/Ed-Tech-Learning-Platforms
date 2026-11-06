'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { BulkFieldsForm } from './BulkFieldsForm';

import type { ReferenceOptions } from '../list/useReferenceOptions';
import type { BulkEditState } from './useBulkEdit';
import type { FC } from 'react';

interface BulkEditPanelProps {
  form: BulkEditState;
  options: ReferenceOptions;
}

/** Right side of the bulk dialog: the fields to change on every selected course. */
export const BulkEditPanel: FC<BulkEditPanelProps> = ({ form, options }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ minWidth: 0, p: { xs: 2, sm: 2.5 } }}>
      <Typography component="h3" sx={{ fontWeight: 700, mb: 2 }}>
        {t('adminCourses.bulk.tabs.fields')}
      </Typography>
      <BulkFieldsForm fields={form.fields} setField={form.setField} options={options} />
    </Box>
  );
};
