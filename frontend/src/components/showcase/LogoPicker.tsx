'use client';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ImageFileButton } from './common/ImageFileButton';
import { toKb } from './image-files';

import type { SiteLogo } from '@/schemas/showcase.schema';
import type { FC } from 'react';

interface LogoPickerProps {
  logo: SiteLogo | null;
  file: File | null;
  /** Translated reason the picked file was refused */
  error: string | null;
  saving: boolean;
  onFiles: (files: File[]) => void;
  onSave: () => void;
}

/** Choose a logo file, see its name and size (or why it is refused), and save it. */
export const LogoPicker: FC<LogoPickerProps> = ({ logo, file, error, saving, onFiles, onSave }) => {
  const { t } = useTranslation();
  return (
    <Stack spacing={1.5}>
      <ImageFileButton
        onFiles={onFiles}
        startIcon={<CloudUploadIcon />}
        sx={{ justifyContent: 'flex-start' }}
      >
        {t('showcase.logo.choose')}
      </ImageFileButton>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {file
            ? t('showcase.form.fileInfo', { name: file.name, size: toKb(file.size) })
            : t('showcase.logo.chooseHint')}
        </Typography>
      )}
      {logo?.imageWidth && logo.imageHeight ? (
        <Typography variant="caption" color="text.secondary">
          {t('showcase.logo.currentSize', { width: logo.imageWidth, height: logo.imageHeight })}
        </Typography>
      ) : null}
      <Box>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!file}
          loading={saving}
          sx={{ fontWeight: 800, minHeight: 44 }}
        >
          {logo ? t('showcase.logo.update') : t('showcase.logo.save')}
        </Button>
      </Box>
    </Stack>
  );
};
