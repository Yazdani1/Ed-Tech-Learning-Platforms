import MenuBookIcon from '@mui/icons-material/MenuBook';
import Box from '@mui/material/Box';

import { isCloudinaryUrl } from '@/utils/urls';

import type { FC } from 'react';

interface TeacherCourseThumbProps {
  coverImage: string | null | undefined;
}

export const THUMB_WIDTH = 72;
const THUMB_HEIGHT = 52;

/** Small course cover (a book icon without one); hidden on phones. */
export const TeacherCourseThumb: FC<TeacherCourseThumbProps> = ({ coverImage }) => (
  <Box
    sx={{
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
      borderRadius: 1,
      overflow: 'hidden',
      bgcolor: 'action.hover',
      display: { xs: 'none', sm: 'flex' },
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {isCloudinaryUrl(coverImage) ? (
      <Box
        component="img"
        src={coverImage}
        alt=""
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      <MenuBookIcon color="primary" aria-hidden />
    )}
  </Box>
);
