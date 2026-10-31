'use client';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import type { FilterOption } from '@/components/common/FilterSelect';
import type { FC } from 'react';

interface TeacherMultiSelectProps {
  label: string;
  placeholder: string;
  noOptionsText: string;
  teachers: readonly FilterOption[];
  /** The picked teacher ids */
  value: readonly string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  /** Error text (e.g. the teachers could not be loaded) */
  error?: string;
  size?: 'small' | 'medium';
}

/** Pick teachers (chips, each can be removed): the course editor and the bulk edit form. */
export const TeacherMultiSelect: FC<TeacherMultiSelectProps> = ({
  label,
  placeholder,
  noOptionsText,
  teachers,
  value,
  onChange,
  loading = false,
  error,
  size = 'medium',
}) => (
  <Autocomplete
    multiple
    size={size}
    options={teachers}
    loading={loading}
    value={teachers.filter((teacher) => value.includes(teacher.value))}
    onChange={(_event, picked) => {
      onChange(picked.map((teacher) => teacher.value));
    }}
    getOptionLabel={(teacher) => teacher.label}
    isOptionEqualToValue={(teacher, picked) => teacher.value === picked.value}
    noOptionsText={noOptionsText}
    slotProps={{ listbox: { sx: { '& .MuiAutocomplete-option': { minHeight: 44 } } } }}
    renderInput={(params) => (
      <TextField
        {...params}
        label={label}
        placeholder={placeholder}
        error={error !== undefined}
        helperText={error}
        sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
      />
    )}
  />
);
