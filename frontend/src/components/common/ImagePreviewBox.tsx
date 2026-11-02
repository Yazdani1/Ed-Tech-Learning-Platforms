import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import Box from '@mui/material/Box';

import type { FC } from 'react';

interface ImagePreviewBoxProps {
  url?: string | null;
  /** Width and height in px */
  size: number;
  /** Round (profile pictures, cropped) instead of a rounded square (logos, whole image) */
  round?: boolean;
}

/** A small square (or round) preview of an image, or an image icon when there is none. */
export const ImagePreviewBox: FC<ImagePreviewBoxProps> = ({ url, size, round = false }) => (
  <Box
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: round ? '50%' : 1,
      border: 1,
      borderColor: 'divider',
      bgcolor: 'grey.50',
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden',
    }}
  >
    {/* A plain <img>: the preview may be a local blob: address (a picked file), which next/image cannot load */}
    {url ? (
      <Box
        component="img"
        src={url}
        alt=""
        sx={{ width: '100%', height: '100%', objectFit: round ? 'cover' : 'contain' }}
      />
    ) : (
      <ImageOutlinedIcon color="disabled" aria-hidden />
    )}
  </Box>
);
