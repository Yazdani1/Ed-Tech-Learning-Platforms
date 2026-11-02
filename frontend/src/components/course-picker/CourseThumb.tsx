import School from '@mui/icons-material/School';
import Box from '@mui/material/Box';

import { CloudImage } from '@/components/common/CloudImage';
import { isCloudinaryUrl } from '@/utils/urls';

import type { FC } from 'react';

const DEFAULT_WIDTH = 72;
/** Course covers are 16:9 */
const COVER_RATIO = 16 / 9;

interface CourseThumbProps {
  coverImage?: string | null;
  /** Width in px (height follows the 16:9 cover shape) */
  width?: number;
}

/** A course cover thumbnail (decorative: the title next to it names the course); a school icon without one. */
export const CourseThumb: FC<CourseThumbProps> = ({ coverImage, width = DEFAULT_WIDTH }) => (
  <Box
    aria-hidden
    sx={{
      position: 'relative',
      width,
      height: Math.round(width / COVER_RATIO),
      borderRadius: 1,
      overflow: 'hidden',
      bgcolor: 'grey.200',
      color: 'grey.500',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
    }}
  >
    {isCloudinaryUrl(coverImage) ? (
      <CloudImage
        url={coverImage}
        alt=""
        sizes={`${String(width)}px`}
        sx={{ position: 'absolute', inset: 0 }}
      />
    ) : (
      <School fontSize="small" />
    )}
  </Box>
);
