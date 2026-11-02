'use client';

import LaunchIcon from '@mui/icons-material/Launch';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ProjectLinksProps {
  liveDemoUrl: string;
  /** A non-YouTube video link (YouTube videos play inside the panel instead) */
  externalVideoUrl: string;
}

/** "Live demo" and "Watch intro video" buttons (each opens a new tab); nothing when both are empty. */
export const ProjectLinks: FC<ProjectLinksProps> = ({ liveDemoUrl, externalVideoUrl }) => {
  const { t } = useTranslation();
  if (!liveDemoUrl && !externalVideoUrl) return null;
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {liveDemoUrl && (
        <Button
          variant="contained"
          href={liveDemoUrl}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<LaunchIcon />}
          sx={{ minHeight: 44 }}
        >
          {t('browse.extras.liveDemo')}
        </Button>
      )}
      {externalVideoUrl && (
        <Button
          variant="outlined"
          href={externalVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<PlayCircleOutlineIcon />}
          sx={{ minHeight: 44 }}
        >
          {t('browse.extras.watchVideo')}
        </Button>
      )}
    </Box>
  );
};
