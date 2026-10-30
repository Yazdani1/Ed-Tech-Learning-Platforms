import Box from '@mui/material/Box';

import { youTubeEmbedUrl } from '../course-utils';

import type { FC } from 'react';

interface YouTubeEmbedProps {
  /** The 11-character YouTube id (never a raw address from the database) */
  videoId: string;
  title: string;
}

/** A YouTube player (privacy-enhanced domain) that fills its parent; starts playing at once. */
export const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ videoId, title }) => (
  <Box
    component="iframe"
    src={youTubeEmbedUrl(videoId)}
    title={title}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin"
    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
  />
);
