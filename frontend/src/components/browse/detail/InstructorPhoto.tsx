import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

import { DISPLAY_FONT } from '@/theme/fonts';
import { isCloudinaryUrl } from '@/utils/urls';

import { pickByIndex } from './detail-styles';

import type { TeacherRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface InstructorPhotoProps {
  teacher: TeacherRef;
  /** Position in the list: picks the colour of the circle */
  index: number;
}

const PHOTO_SIZE = 128;
const DOT_SIZE = 18;
const INITIALS = 2;
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)',
  'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
  'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
] as const;

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, INITIALS)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

/** A teacher's round photo (or initials on a gradient) with a white ring and a green dot. */
export const InstructorPhoto: FC<InstructorPhotoProps> = ({ teacher, index }) => (
  <Box sx={{ position: 'relative', flexShrink: 0 }}>
    <Avatar
      src={isCloudinaryUrl(teacher.profileImage) ? teacher.profileImage : undefined}
      alt={teacher.name}
      sx={{
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        fontFamily: DISPLAY_FONT,
        fontSize: '2.5rem',
        fontWeight: 700,
        background: pickByIndex(AVATAR_GRADIENTS, index),
        border: '5px solid #fff',
        boxShadow: '0 8px 22px rgba(15,23,42,0.18)',
      }}
    >
      {initialsOf(teacher.name)}
    </Avatar>
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        right: 6,
        bottom: 8,
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: '50%',
        bgcolor: '#10b981',
        border: '3px solid #fff',
      }}
    />
  </Box>
);
