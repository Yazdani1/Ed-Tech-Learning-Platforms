'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

import { TEACHER_GRADIENT } from '../home/gradients';
import { isCloudinaryUrl } from '@/utils/urls';

import type { TeacherProfile } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherAvatarProps {
  teacher: TeacherProfile;
  /** Height of the coloured header band */
  bandHeight: number;
  /** Avatar diameter; half of it hangs below the band */
  size: number;
}

/** Gradient header band with the teacher's round photo (or initial) overlapping its bottom edge. */
export const TeacherAvatar: FC<TeacherAvatarProps> = ({ teacher, bandHeight, size }) => (
  <Box
    sx={{ height: bandHeight, background: TEACHER_GRADIENT, position: 'relative', flexShrink: 0 }}
  >
    <Avatar
      src={isCloudinaryUrl(teacher.profileImage) ? teacher.profileImage : undefined}
      alt={teacher.name}
      sx={{
        width: size,
        height: size,
        position: 'absolute',
        left: '50%',
        bottom: -size / 2,
        transform: 'translateX(-50%)',
        border: '4px solid white',
        bgcolor: 'primary.main',
        fontSize: size / 2.8,
        fontWeight: 800,
        boxShadow: '0 10px 28px rgba(15,23,42,0.2)',
      }}
    >
      {teacher.name.charAt(0).toUpperCase()}
    </Avatar>
  </Box>
);
