'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface PlanFilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** A single-choice filter with an "All" entry (empty value). */
export const PlanFilterSelect: FC<PlanFilterSelectProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      <MenuItem value="">{t('public.planCourses.any')}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};
