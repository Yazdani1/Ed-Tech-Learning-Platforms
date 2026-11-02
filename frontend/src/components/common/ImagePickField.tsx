'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useState, type ChangeEvent, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { IMAGE_ACCEPT, IMAGE_MAX_MB, findImageProblem } from '@/utils/image-files';

import { ImagePreviewBox } from './ImagePreviewBox';

interface ImagePickFieldProps {
  label: string;
  /** The image shown now (saved URL or a local preview) */
  previewUrl?: string | null;
  /** Called with one checked image file (PNG/JPEG/GIF/WEBP, at most 5 MB) */
  onFile: (file: File) => void;
  /** An upload is running (shows a spinner, disables the button) */
  busy?: boolean;
  /** Error from outside (e.g. the upload failed) */
  error?: string | null;
  /** Preview box size in px */
  size?: number;
  /** Round preview (profile pictures) */
  round?: boolean;
}

const DEFAULT_SIZE = 72;

/** A small image preview with a "Choose image" button; the picked file is checked before onFile. */
export const ImagePickField: FC<ImagePickFieldProps> = ({
  label,
  previewUrl,
  onFile,
  busy = false,
  error,
  size = DEFAULT_SIZE,
  round = false,
}) => {
  const { t } = useTranslation();
  const [problem, setProblem] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;
    const found = findImageProblem([file], 1);
    if (found?.reason === 'badType') setProblem(t('catalog.media.badType'));
    else if (found?.reason === 'tooLarge')
      setProblem(t('catalog.media.tooLarge', { max: IMAGE_MAX_MB }));
    else {
      setProblem(null);
      onFile(file);
    }
  };
  const message = problem ?? error;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ImagePreviewBox url={previewUrl} size={size} round={round} />
        <Button
          component="label"
          variant="outlined"
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} /> : <AddPhotoAlternateIcon />}
          sx={{ minHeight: 44, fontWeight: 700 }}
        >
          {label}
          <input hidden type="file" accept={IMAGE_ACCEPT} onChange={handleChange} />
        </Button>
      </Box>
      {message && (
        <Typography variant="caption" color="error" role="alert" sx={{ display: 'block', mt: 0.5 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};
