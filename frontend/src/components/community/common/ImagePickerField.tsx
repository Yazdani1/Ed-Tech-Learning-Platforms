'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import UploadIcon from '@mui/icons-material/Upload';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { IMAGE_ACCEPT } from '@/utils/image-files';

import type { ImagePicker } from './useImagePicker';

import type { ChangeEvent, FC } from 'react';

interface ImagePickerFieldProps {
  picker: ImagePicker;
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Extra note under the button (e.g. "new images replace the current ones") */
  hint?: string;
}

/** "Upload images" button with the picked files as removable chips and the file check message. */
export const ImagePickerField: FC<ImagePickerFieldProps> = ({
  picker,
  label,
  multiple = false,
  disabled = false,
  hint,
}) => {
  const { t } = useTranslation();

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    picker.add(Array.from(event.target.files ?? []));
    // The same file can be picked again after it was removed
    event.target.value = '';
  };

  return (
    <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
      <Button
        variant="outlined"
        component="label"
        startIcon={<UploadIcon />}
        disabled={disabled}
        sx={{ minHeight: 44 }}
      >
        {label}
        <input hidden type="file" accept={IMAGE_ACCEPT} multiple={multiple} onChange={onChange} />
      </Button>
      {hint && <FormHelperText sx={{ m: 0 }}>{hint}</FormHelperText>}
      {picker.files.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, maxWidth: '100%' }}>
          {picker.files.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              label={file.name}
              variant="outlined"
              onDelete={() => {
                picker.remove(index);
              }}
              deleteIcon={
                <CancelIcon
                  role="button"
                  aria-hidden={false}
                  aria-label={t('community.images.remove', { name: file.name })}
                />
              }
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Stack>
      )}
      {picker.error && (
        <FormHelperText error role="alert" sx={{ m: 0 }}>
          {picker.error}
        </FormHelperText>
      )}
    </Stack>
  );
};
