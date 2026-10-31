'use client';

import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { COVER_MAX_MB, COVER_TYPES } from '@/schemas/course-editor.schema';

import { CoverPreview } from './CoverPreview';

import type { CoverImage } from '../useCoverImage';
import type { ChangeEvent, FC } from 'react';

interface MediaTabProps {
  cover: CoverImage;
  /** The cover already saved on the course (Cloudinary) */
  savedCover: string | null | undefined;
  onPick: (file: File) => void;
  /** True for an existing course: a picked image is uploaded by the auto-save */
  autoUploads: boolean;
}

const FORM_MAX_WIDTH = 720;

/** Course cover image: preview, pick a new one (image, max 5 MB), undo a pick that is not saved yet. */
export const MediaTab: FC<MediaTabProps> = ({ cover, savedCover, onPick, autoUploads }) => {
  const { t } = useTranslation();

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) onPick(file);
    // Picking the same file again must fire a change event too
    event.target.value = '';
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: FORM_MAX_WIDTH }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
        {t('catalog.media.title')}
      </Typography>
      <CoverPreview picked={cover.preview} saved={savedCover} />
      <Typography variant="body2" color="text.secondary">
        {t(autoUploads ? 'catalog.media.hintAuto' : 'catalog.media.hintNew', { max: COVER_MAX_MB })}
      </Typography>
      {cover.error && <Alert severity="error">{cover.error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          sx={{ minHeight: 44 }}
        >
          {t('catalog.media.upload')}
          <input hidden type="file" accept={COVER_TYPES.join(',')} onChange={handleChange} />
        </Button>
        {cover.file && !autoUploads && (
          <Button
            color="inherit"
            startIcon={<CloseIcon />}
            onClick={cover.clear}
            sx={{ minHeight: 44 }}
          >
            {t('catalog.media.remove')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
