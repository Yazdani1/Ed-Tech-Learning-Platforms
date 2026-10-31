'use client';

import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { LazyRichTextEditor } from './LazyRichTextEditor';

import type { RichTextFeatures } from './rich-text.types';
import type { ReactElement } from 'react';

interface RichTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  minHeight?: number;
  features?: RichTextFeatures;
  /** Show the label above the editor (default true) */
  showLabel?: boolean;
}

/**
 * A rich text form field (React Hook Form) with its label and validation message (an i18n key).
 * (Generic over the form values, so it is a function rather than an FC.)
 */
export const RichTextField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  minHeight,
  features,
  showLabel = true,
}: RichTextFieldProps<T>): ReactElement => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Box>
          {showLabel && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {label}
            </Typography>
          )}
          <LazyRichTextEditor
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={field.onChange}
            label={label}
            placeholder={placeholder}
            minHeight={minHeight}
            features={features}
            error={fieldState.error !== undefined}
          />
          {fieldState.error?.message && (
            <FormHelperText error>{t(fieldState.error.message)}</FormHelperText>
          )}
        </Box>
      )}
    />
  );
};
