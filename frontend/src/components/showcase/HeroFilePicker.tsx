'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ImageFileButton } from './common/ImageFileButton';
import { toKb } from './image-files';

import type { FC } from 'react';

interface HeroFilePickerProps {
  /** Edit: a replacement image; create: the new image (one at a time) */
  isEdit: boolean;
  files: File[];
  /** Translated problem with the picked files, if any */
  error: string | null;
  onFiles: (files: File[]) => void;
}

const DROP_ZONE_MIN_HEIGHT = 132;

/** The big dashed "choose banner images" button, the size hint and the picked files. */
export const HeroFilePicker: FC<HeroFilePickerProps> = ({ isEdit, files, error, onFiles }) => {
  const { t } = useTranslation();
  return (
    <>
      <ImageFileButton
        multiple={false}
        onFiles={onFiles}
        sx={{
          minHeight: DROP_ZONE_MIN_HEIGHT,
          borderStyle: 'dashed',
          borderWidth: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          textAlign: 'center',
        }}
      >
        <AddPhotoAlternateIcon sx={{ fontSize: 40 }} aria-hidden />
        {isEdit ? t('showcase.form.chooseReplacement') : t('showcase.form.chooseOne')}
      </ImageFileButton>
      <Typography variant="caption" color="text.secondary">
        {t('showcase.form.sizeHint')}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {files.length > 0 && (
        <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 0.5 }}>
          {files.map((file) => (
            <Typography
              key={`${file.name}-${file.size}`}
              variant="body2"
              sx={{ overflowWrap: 'anywhere' }}
            >
              {t('showcase.form.fileInfo', { name: file.name, size: toKb(file.size) })}
            </Typography>
          ))}
        </Box>
      )}
    </>
  );
};
