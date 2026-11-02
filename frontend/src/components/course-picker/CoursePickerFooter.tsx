'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

const TOUCH_TARGET = 44;

interface CoursePickerFooterProps {
  /** Ticked courses (0 = all courses) */
  selectedCount: number;
  onClear: () => void;
  onApply: () => void;
}

/** "Clear" and "Apply (n courses)" / "Show all courses" at the bottom of the course picker. */
export const CoursePickerFooter: FC<CoursePickerFooterProps> = ({
  selectedCount,
  onClear,
  onApply,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        justifyContent: 'flex-end',
        p: { xs: 2, sm: 3 },
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Button onClick={onClear} disabled={selectedCount === 0} sx={{ minHeight: TOUCH_TARGET }}>
        {t('coursePicker.clear')}
      </Button>
      <Button variant="contained" onClick={onApply} sx={{ minHeight: TOUCH_TARGET }}>
        {selectedCount === 0
          ? t('coursePicker.applyAll')
          : t('coursePicker.apply', { count: selectedCount })}
      </Button>
    </Box>
  );
};
