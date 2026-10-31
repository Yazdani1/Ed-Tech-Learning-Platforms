'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { BulkSelection } from './useBulkSelection';
import type { FC } from 'react';

interface SelectAllBarProps {
  selection: BulkSelection;
}

const BAR_SX = {
  px: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  borderTop: 1,
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: 'action.hover',
} as const;

/** "Select all (N)" for the courses that match the dialog's filters, and the selected count. */
export const SelectAllBar: FC<SelectAllBarProps> = ({ selection }) => {
  const { t } = useTranslation();
  const { allVisibleSelected, someVisibleSelected, visible, selectedIds } = selection;
  return (
    <Box sx={BAR_SX}>
      <FormControlLabel
        control={
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={!allVisibleSelected && someVisibleSelected}
            onChange={selection.toggleAllVisible}
            disabled={visible.length === 0}
          />
        }
        label={
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t(
              allVisibleSelected ? 'adminCourses.bulk.deselectAll' : 'adminCourses.bulk.selectAll',
              {
                count: visible.length,
              },
            )}
          </Typography>
        }
      />
      {selectedIds.size > 0 && (
        <Chip
          label={t('adminCourses.bulk.selected', { count: selectedIds.size })}
          size="small"
          color="primary"
          sx={{ fontWeight: 700 }}
        />
      )}
    </Box>
  );
};
