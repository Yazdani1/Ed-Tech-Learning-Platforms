'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';

import type { FC } from 'react';

interface CoverPreviewProps {
  /** blob: address of a picked file that is not uploaded yet */
  picked: string | null;
  /** The cover saved on the course (Cloudinary) */
  saved: string | null | undefined;
}

const PREVIEW_HEIGHT = 280;
const PREVIEW_WIDTH = 720;

/** The picked image (before upload), else the saved cover, else a placeholder. */
export const CoverPreview: FC<CoverPreviewProps> = ({ picked, saved }) => {
  const { t } = useTranslation();
  return (
    <Paper variant="outlined" sx={{ borderStyle: 'dashed', overflow: 'hidden', borderRadius: 2 }}>
      {picked ? (
        <Box
          component="img"
          src={picked}
          alt={t('catalog.media.previewAlt')}
          sx={{ display: 'block', width: '100%', maxHeight: PREVIEW_HEIGHT, objectFit: 'contain' }}
        />
      ) : (
        <CourseCover
          src={saved}
          alt={t('catalog.media.currentAlt')}
          height={PREVIEW_HEIGHT}
          sizes={`${PREVIEW_WIDTH}px`}
        />
      )}
    </Paper>
  );
};
