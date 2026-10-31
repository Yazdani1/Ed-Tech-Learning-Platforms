'use client';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface FreePreviewSwitchProps {
  checked: boolean;
  /** What the switch is for, e.g. "Free preview for Algebra" */
  label: string;
  onToggle: () => void;
}

/** "Free" switch of a quiz section or bank (free preview: open to visitors). */
export const FreePreviewSwitch: FC<FreePreviewSwitchProps> = ({ checked, label, onToggle }) => {
  const { t } = useTranslation();
  return (
    <FormControlLabel
      label={t('catalog.quiz.free')}
      labelPlacement="start"
      sx={{
        m: 0,
        minHeight: 44,
        '& .MuiFormControlLabel-label': { fontSize: '0.75rem', color: 'text.secondary' },
      }}
      control={
        <Switch
          size="small"
          color="success"
          checked={checked}
          onChange={onToggle}
          slotProps={{ input: { 'aria-label': label } }}
        />
      }
    />
  );
};
