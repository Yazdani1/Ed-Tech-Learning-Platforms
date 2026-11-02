import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { CloudImage } from '@/components/common/CloudImage';

import type { FC } from 'react';

interface ScreenshotThumbProps {
  url: string;
  removeLabel: string;
  onRemove: () => void;
}

const THUMB_SX = {
  position: 'relative',
  aspectRatio: '16 / 10',
  borderRadius: 1,
  overflow: 'hidden',
  bgcolor: 'grey.100',
} as const;
const REMOVE_SX = {
  position: 'absolute',
  top: 4,
  right: 4,
  bgcolor: 'rgba(255,255,255,0.9)',
  '&:hover': { bgcolor: 'common.white' },
} as const;

/** A screenshot thumbnail with its remove button. */
export const ScreenshotThumb: FC<ScreenshotThumbProps> = ({ url, removeLabel, onRemove }) => (
  <Box sx={THUMB_SX}>
    <CloudImage url={url} alt="" sizes="200px" sx={{ width: '100%', height: '100%' }} />
    <IconButton size="small" aria-label={removeLabel} onClick={onRemove} sx={REMOVE_SX}>
      <CloseIcon fontSize="small" />
    </IconButton>
  </Box>
);
