'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Controller, type Control } from 'react-hook-form';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  control: Control<CourseDetailsForm>;
  name: 'category' | 'courseType' | 'visibility' | 'pricing';
  label: string;
  options: SelectOption[];
  required?: boolean;
  helperText?: string;
}

/** A select bound to one text field of the course details form. */
export const FormSelect: FC<FormSelectProps> = ({
  control,
  name,
  label,
  options,
  required = false,
  helperText,
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <TextField
        select
        fullWidth
        label={label}
        required={required}
        value={options.some((option) => option.value === field.value) ? field.value : ''}
        onChange={field.onChange}
        onBlur={field.onBlur}
        inputRef={field.ref}
        error={fieldState.invalid}
        helperText={helperText}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value} sx={{ minHeight: 44 }}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    )}
  />
);
