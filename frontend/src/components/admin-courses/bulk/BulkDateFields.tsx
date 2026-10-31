'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { BULK_GRID_SX, BULK_INPUT_SX, type BulkFieldsState, type SetBulkField } from './bulk-form';

import type { FC } from 'react';

interface BulkDateFieldsProps {
  fields: BulkFieldsState;
  setField: SetBulkField;
}

/** Start and end date of the courses (empty = no change). */
export const BulkDateFields: FC<BulkDateFieldsProps> = ({ fields, setField }) => {
  const { t } = useTranslation();
  return (
    <Box sx={BULK_GRID_SX}>
      <TextField
        size="small"
        type="date"
        label={t('adminCourses.bulk.startDate')}
        value={fields.startDate}
        onChange={(event) => {
          setField('startDate', event.target.value);
        }}
        helperText={t('adminCourses.bulk.leaveEmpty')}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={BULK_INPUT_SX}
      />
      <TextField
        size="small"
        type="date"
        label={t('adminCourses.bulk.endDate')}
        value={fields.endDate}
        onChange={(event) => {
          setField('endDate', event.target.value);
        }}
        helperText={t('adminCourses.bulk.leaveEmpty')}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { min: fields.startDate || undefined },
        }}
        sx={BULK_INPUT_SX}
      />
    </Box>
  );
};
