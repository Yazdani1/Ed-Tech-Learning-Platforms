'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PROJECT_MAX_IMAGES, type CourseImage } from '@/schemas/course-extras.schema';
import { IMAGE_ACCEPT } from '@/utils/image-files';

import { ScreenshotThumb } from './ScreenshotThumb';
import { useScreenshotUpload } from './useScreenshotUpload';

import type { FC } from 'react';

interface ProjectImagesFieldProps {
  courseId: string;
  images: CourseImage[];
  /** New pictures (added to the latest list, so a removal during an upload is kept) */
  onAdd: (images: CourseImage[]) => void;
  onRemove: (publicId: string) => void;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
  gap: 1,
  mb: 1.5,
} as const;

/** Project screenshots: thumbnails with a remove button, and "Add screenshots" (several at once). */
export const ProjectImagesField: FC<ProjectImagesFieldProps> = ({
  courseId,
  images,
  onAdd,
  onRemove,
}) => {
  const { t } = useTranslation();
  const upload = useScreenshotUpload(courseId, PROJECT_MAX_IMAGES - images.length, onAdd);

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>
        {t('catalog.extras.projects.screenshots', {
          count: images.length,
          max: PROJECT_MAX_IMAGES,
        })}
      </Typography>
      {images.length > 0 && (
        <Box sx={GRID_SX}>
          {images.map((image, index) => (
            <ScreenshotThumb
              key={image.publicId}
              url={image.url}
              removeLabel={t('catalog.extras.projects.removeImage', { number: index + 1 })}
              onRemove={() => {
                onRemove(image.publicId);
              }}
            />
          ))}
        </Box>
      )}
      <Button
        component="label"
        variant="outlined"
        disabled={upload.busy || images.length >= PROJECT_MAX_IMAGES}
        startIcon={upload.busy ? <CircularProgress size={16} /> : <AddPhotoAlternateIcon />}
        sx={{ minHeight: 44, fontWeight: 700 }}
      >
        {t('catalog.extras.projects.addImages')}
        <input
          hidden
          type="file"
          multiple
          accept={IMAGE_ACCEPT}
          onChange={(event) => void upload.onPick(event)}
        />
      </Button>
      {upload.error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {upload.error}
        </Alert>
      )}
    </Box>
  );
};
