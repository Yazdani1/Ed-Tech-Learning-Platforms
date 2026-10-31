'use client';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl } from '@/utils/urls';

import { TEACHER_IMAGE_TYPES } from './teacher-utils';
import { useTeacherImageChoice } from './useTeacherImageChoice';

import type { FC } from 'react';

interface TeacherImagePickerProps {
  /** The current photo (Cloudinary) when editing */
  currentUrl: string | null | undefined;
  file: File | null;
  onChange: (file: File | null) => void;
  /** First letter shown when there is no photo */
  initial: string;
}

const PREVIEW_SIZE = 88;
const BYTES_PER_KB = 1024;

/** Profile photo: preview, Upload/Replace button, chosen file name; checks type and size first. */
export const TeacherImagePicker: FC<TeacherImagePickerProps> = ({
  currentUrl,
  file,
  onChange,
  initial,
}) => {
  const { t } = useTranslation();
  const { error, previewUrl, handleSelect } = useTeacherImageChoice(file, onChange);
  const shown = previewUrl ?? (isCloudinaryUrl(currentUrl) ? currentUrl : undefined);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
    >
      <Avatar
        src={shown}
        alt={t('people.teachers.imagePreview')}
        sx={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, fontSize: 30, fontWeight: 900 }}
      >
        {initial}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography sx={{ fontWeight: 800 }}>{t('people.teachers.imageTitle')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          {t('people.teachers.imageHelp')}
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ minHeight: 44 }}
        >
          {currentUrl ? t('people.teachers.replaceImage') : t('people.teachers.uploadImage')}
          <input
            type="file"
            accept={TEACHER_IMAGE_TYPES.join(',')}
            hidden
            onChange={handleSelect}
          />
        </Button>
        {file && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {t('people.teachers.selectedFile', {
              name: file.name,
              size: Math.round(file.size / BYTES_PER_KB),
            })}
          </Typography>
        )}
        {error && (
          <Typography variant="caption" color="error" role="alert" sx={{ display: 'block', mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
