import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { isCloudinaryUrl } from '@/utils/urls';

import type { TeacherRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface InstructorCardProps {
  teacher: TeacherRef;
  /** Position in the list: picks one of the pastel colour sets */
  index: number;
}

const PALETTE = [
  { cardBg: '#e8f4fd', photoBg: '#bbdefb', accent: '#1565c0' },
  { cardBg: '#f3e8fd', photoBg: '#e1bee7', accent: '#6a1b9a' },
  { cardBg: '#e8fdf0', photoBg: '#c8e6c9', accent: '#2e7d32' },
  { cardBg: '#fdf6e8', photoBg: '#ffe0b2', accent: '#e65100' },
  { cardBg: '#fde8e8', photoBg: '#ffcdd2', accent: '#c62828' },
  { cardBg: '#e8fdfd', photoBg: '#b2ebf2', accent: '#00695c' },
] as const;
const BIO_MAX = 80;
const CARD_SX = {
  borderRadius: 3,
  p: 2.5,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
} as const;
const PHOTO_SX = {
  width: 100,
  height: 100,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mb: 2,
} as const;
const EXPERTISE_SHOWN = 3;

/** One teacher of the course: photo (or initial), name, short bio and up to three expertise chips. */
export const InstructorCard: FC<InstructorCardProps> = ({ teacher, index }) => {
  const colors = PALETTE[index % PALETTE.length] ?? PALETTE[0];
  const bio = teacher.bio ?? '';
  return (
    <Box sx={{ ...CARD_SX, bgcolor: colors.cardBg }}>
      <Box sx={{ ...PHOTO_SX, bgcolor: colors.photoBg }}>
        <Avatar
          src={isCloudinaryUrl(teacher.profileImage) ? teacher.profileImage : undefined}
          alt={teacher.name}
          sx={{ width: 88, height: 88, fontSize: 32, bgcolor: colors.accent }}
        >
          {teacher.name.charAt(0)}
        </Avatar>
      </Box>
      <Typography
        component="h3"
        variant="subtitle1"
        sx={{ fontWeight: 700, mb: 0.5, color: 'grey.900' }}
      >
        {teacher.name}
      </Typography>
      {bio && (
        <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.5, color: 'grey.700' }}>
          {bio.length > BIO_MAX ? `${bio.slice(0, BIO_MAX)}…` : bio}
        </Typography>
      )}
      {teacher.expertise.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {teacher.expertise.slice(0, EXPERTISE_SHOWN).map((skill) => (
            <Chip
              key={skill}
              label={skill}
              size="small"
              sx={{ bgcolor: colors.accent, color: 'common.white', fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
